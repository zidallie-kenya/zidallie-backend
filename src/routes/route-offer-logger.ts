/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';
import { RouteOfferNotifications } from './route-offer-notifications.port';

/**
 * Temporary stand-in — bind ROUTE_OFFER_NOTIFICATIONS to your real
 * NotificationsService (push + WhatsApp) instead of this once wired.
 * Keeping this bound in the meantime means the cascade logic itself is
 * fully testable without the real integrations in place.
 *
 * Every method is `async` (even though the body is synchronous) because
 * RouteOfferNotifications declares Promise<void> returns — callers in
 * RouteOfferService `await` these calls, so a plain `void`-returning
 * implementation fails to satisfy the interface under strict mode.
 */
@Injectable()
export class RouteOfferLoggingNotifications implements RouteOfferNotifications {
  private readonly logger = new Logger(RouteOfferLoggingNotifications.name);

  async sendDriverRouteOffer(params: {
    driverId: number;
    routeId: number;
    kind: 'pickup' | 'dropoff';
    studentCount: number;
    distanceKm: number;
  }): Promise<void> {
    this.logger.warn(
      `[STUB] would push route offer to driver ${params.driverId}: route #${params.routeId} ` +
        `(${params.kind}, ${params.studentCount} students, ${params.distanceKm}km away)`,
    );
  }

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
    this.logger.warn(
      `[STUB] would notify ${params.parents.length} parent(s) about driver ` +
        `${params.driverName} matched to route #${params.routeId}`,
    );
  }

  async notifyDriverRouteTaken(params: {
    driverId: number;
    routeId: number;
  }): Promise<void> {
    this.logger.warn(
      `[STUB] would notify driver ${params.driverId} that route #${params.routeId} was taken by someone else`,
    );
  }

  async sendAdminAlert(params: {
    subject: string;
    message: string;
    routeId: number;
  }): Promise<void> {
    this.logger.warn(
      `[STUB] admin alert — ${params.subject}: ${params.message}`,
    );
  }
}
