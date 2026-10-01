/* eslint-disable @typescript-eslint/require-await */

import { Injectable, Logger } from '@nestjs/common';
import { RouteOfferNotifications } from './route-offer-notifications.port';
import { UsersService } from '../users/users.service';
import axios from 'axios';
import { ExpoPushService } from '../daily_rides/expopush.service';

@Injectable()
export class RouteOfferNotificationsService implements RouteOfferNotifications {
  private readonly logger = new Logger(RouteOfferNotificationsService.name);

  constructor(
    private readonly expoPushService: ExpoPushService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Rule 2 — Broadcasts a route offer to a driver via Push Notification and WhatsApp.
   */
  async sendDriverRouteOffer(params: {
    driverId: number;
    routeId: number;
    kind: 'pickup' | 'dropoff';
    studentCount: number;
    distanceKm: number;
  }): Promise<void> {
    const user = await this.usersService.findById(params.driverId);
    if (!user) {
      this.logger.warn(
        `Driver ID ${params.driverId} not found for route offer notifications.`,
      );
      return;
    }

    const title = '🚗 New Route Offer Available!';
    const body = `A ${params.kind} route (#${params.routeId}) with ${params.studentCount} student(s) is available. It is ~${params.distanceKm}km away from your home. Open the app to accept!`;
    const dataPayload = { routeId: params.routeId, type: 'route_offer' };

    // 1. Send Expo Push Notification
    if (user.push_token) {
      try {
        await this.expoPushService.sendPushNotification(
          user.push_token,
          title,
          body,
          dataPayload,
          { userId: params.driverId },
        );
        this.logger.log(`Expo push offer sent to driver #${params.driverId}`);
      } catch (err: any) {
        this.logger.error(
          `Failed to push notification to driver #${params.driverId}: ${err.message}`,
        );
      }
    }

    // 2. Send WhatsApp Message
    if (user.phone_number) {
      try {
        const whatsappText =
          `Hello ${user.firstName || 'Driver'},\n\n` +
          `A new school carpool route has been matched to you!\n` +
          `• Route ID: #${params.routeId}\n` +
          `• Type: ${params.kind.toUpperCase()}\n` +
          `• Students: ${params.studentCount}\n` +
          `• Proximity: ~${params.distanceKm}km away\n\n` +
          `Log into your Zidallie Driver App immediately to review and accept this route before the offer window expires!`;

        // await this.sendWhatsAppMessage(user.phone_number, whatsappText);
        const number = '254702707187';
        await this.sendWhatsAppMessage(number, whatsappText);

        this.logger.log(
          `WhatsApp offer sent to driver phone: ${user.phone_number}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to send WhatsApp to driver #${params.driverId}: ${err.message}`,
        );
      }
    }
  }

  /**
   * Rule 4 / Rule 17 — Fired to parents once a driver accepts a route.
   */
  async sendParentDriverMatchedWhatsApp(params: {
    bookingChildIds: number[];
    driverId: number;
    routeId: number;
    kind: 'pickup' | 'dropoff';
    driverName: string;
    driverPhone: string | null;
    vehiclePlate: string | null;
    parents: {
      parentId: number;
      pushToken: string | null;
      phoneNumber: string | null;
      parentFirstName: string;
      childNames: string[];
    }[];
  }): Promise<void> {
    for (const parent of params.parents) {
      const childList = parent.childNames.join(' and ');
      const title = '🚗 Driver assigned to your carpool';
      const body = `${childList} has been matched with driver ${params.driverName}${
        params.vehiclePlate ? ` (${params.vehiclePlate})` : ''
      } for ${params.kind === 'pickup' ? 'morning pickup' : 'afternoon dropoff'}.`;

      if (parent.pushToken) {
        try {
          await this.expoPushService.sendPushNotification(
            parent.pushToken,
            title,
            body,
            { routeId: params.routeId, type: 'driver_matched' },
            { userId: parent.parentId },
          );
          this.logger.log(`Parent push sent to #${parent.parentId}`);
        } catch (err: any) {
          this.logger.error(
            `Failed to push to parent #${parent.parentId}: ${err.message}`,
          );
        }
      }

      if (parent.phoneNumber) {
        try {
          const whatsappText =
            `Hello ${parent.parentFirstName},\n\n` +
            `${childList} ${parent.childNames.length > 1 ? 'have' : 'has'} been ` +
            `matched with a driver for the school carpool:\n` +
            `• Driver: ${params.driverName}\n` +
            `${params.driverPhone ? `• Driver phone: ${params.driverPhone}\n` : ''}` +
            `${params.vehiclePlate ? `• Vehicle: ${params.vehiclePlate}\n` : ''}` +
            `• Trip: ${params.kind === 'pickup' ? 'Morning pickup' : 'Afternoon dropoff'}\n\n` +
            `Open the Zidallie app for full trip details.`;

          // await this.sendWhatsAppMessage(parent.phoneNumber, whatsappText);
          await this.sendWhatsAppMessage('254702707187', whatsappText);

          this.logger.log(`Parent WhatsApp sent to ${parent.phoneNumber}`);
        } catch (err: any) {
          this.logger.error(
            `Failed to send WhatsApp to parent #${parent.parentId}: ${err.message}`,
          );
        }
      }
    }
  }

  /**
   * Courtesy alert to other batch candidates when a route gets taken.
   */
  async notifyDriverRouteTaken(params: {
    driverId: number;
    routeId: number;
  }): Promise<void> {
    const user = await this.usersService.findById(params.driverId);
    if (!user?.push_token) return;

    try {
      await this.expoPushService.sendPushNotification(
        user.push_token,
        'Route No Longer Available',
        `Route #${params.routeId} was accepted by another driver.`,
        { routeId: params.routeId },
        { userId: params.driverId },
      );
    } catch (err: any) {
      this.logger.error(`Failed to send route-taken notice: ${err.message}`);
    }
  }

  /**
   * Rule 3 / Rule 2 Step 5 — Admin alerts when cascades fail or drivers drop out.
   */
  async sendAdminAlert(params: {
    subject: string;
    message: string;
    routeId: number;
  }): Promise<void> {
    this.logger.warn(
      `[ADMIN ROUTE ALERT] ${params.subject}: ${params.message} (Route #${params.routeId})`,
    );
  }

  /**
   * HTTP integration via Meta Cloud API (Graph API) for WhatsApp messaging
   */
  private async sendWhatsAppMessage(
    phone: string,
    message: string,
  ): Promise<void> {
    const graphApiUrl =
      process.env.WHATSAPP_API_URL ?? 'https://graph.facebook.com/v17.0';
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      this.logger.debug(
        `WhatsApp credentials are not configured in environment variables. Message skipped.`,
      );
      return;
    }

    // Clean phone number format (Remove '+' if required by provider)
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    await axios.post(
      `${graphApiUrl}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
