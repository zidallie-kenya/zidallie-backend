import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo: Expo;

  constructor() {
    // Create a new Expo SDK client
    // No access token needed for basic push notifications
    this.expo = new Expo({
      useFcmV1: true, // Use FCM v1 (default, can be omitted)
    });
  }

  async sendPushNotification(
    pushTokens: string | string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      // Convert to array if single token
      const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

      // Validate push tokens and create messages
      const messages: ExpoPushMessage[] = [];

      for (const pushToken of tokens) {
        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
          this.logger.error(
            `Push token ${pushToken} is not a valid Expo push token`,
          );
          continue;
        }

        // Construct a message
        messages.push({
          to: pushToken,
          sound: 'default',
          title,
          body,
          data,
        });
      }

      if (messages.length === 0) {
        this.logger.warn('No valid push tokens found');
        return;
      }

      // Chunk the notifications to reduce the number of requests
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      // Send the chunks to the Expo push notification service
      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          this.logger.log(`Sent chunk of ${chunk.length} notifications`);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error(`Error sending notification chunk: ${error}`);
        }
      }

      // Handle tickets and collect receipt IDs
      const receiptIds: string[] = [];
      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
          receiptIds.push(ticket.id);
        } else {
          this.logger.error(`Error in ticket: ${JSON.stringify(ticket)}`);
        }
      }

      this.logger.log(`Successfully sent ${receiptIds.length} notifications`);

      // Optionally, you can check receipts later
      // For now, we'll just log the receipt IDs
      if (receiptIds.length > 0) {
        this.logger.log(`Receipt IDs: ${receiptIds.join(', ')}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      throw error; // Re-throw to maintain existing error handling in your service
    }
  }

  /**
   * Optional method to check receipts later
   * You can call this method periodically to check the status of sent notifications
   */
  async checkReceipts(receiptIds: string[]): Promise<void> {
    try {
      const receiptIdChunks =
        this.expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptIdChunks) {
        try {
          const receipts =
            await this.expo.getPushNotificationReceiptsAsync(chunk);

          // Process receipts
          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];

            if (receipt.status === 'ok') {
              this.logger.log(
                `Notification ${receiptId} delivered successfully`,
              );
            } else if (receipt.status === 'error') {
              this.logger.error(`Error in notification ${receiptId}`);

              if (receipt.details && receipt.details.error) {
                // Handle specific error codes
                switch (receipt.details.error) {
                  case 'DeviceNotRegistered':
                    this.logger.warn(
                      `Device not registered for notification ${receiptId} - should remove token`,
                    );
                    break;
                  case 'InvalidCredentials':
                    this.logger.error(
                      `Invalid credentials for notification ${receiptId}`,
                    );
                    break;
                  case 'MessageTooBig':
                    this.logger.error(
                      `Message too big for notification ${receiptId}`,
                    );
                    break;
                  case 'MessageRateExceeded':
                    this.logger.warn(
                      `Rate limit exceeded for notification ${receiptId}`,
                    );
                    break;
                  default:
                    this.logger.error(
                      `Unknown error code ${receipt.details.error} for notification ${receiptId}`,
                    );
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error checking receipt chunk: ${error}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to check receipts: ${error.message}`);
    }
  }

  /**
   * Validate if a token is a valid Expo push token
   */
  isValidExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }
}
