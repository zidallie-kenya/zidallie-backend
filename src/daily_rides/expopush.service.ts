import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo: Expo;
  private readonly EXPO_URL = 'https://exp.host/--/api/v2/push/send';

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
      // Ensure array
      const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

      console.log('=== PUSH NOTIFICATION DEBUG ===');
      console.log('Received tokens:', tokens);

      // Filter only valid expo push tokens
      const validTokens = tokens.filter(
        (t) =>
          t &&
          (t.startsWith('ExpoPushToken') || t.startsWith('ExponentPushToken')),
      );

      console.log('Valid tokens after filter:', validTokens);
      console.log('Title:', title);
      console.log('Body:', body);
      console.log('Data:', data);

      if (validTokens.length === 0) {
        this.logger.warn('No valid Expo push tokens found');
        console.log('❌ NO VALID TOKENS - stopping here');
        return;
      }

      // Build messages payload
      const messages = validTokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      console.log('Messages to send:', JSON.stringify(messages, null, 2));

      // Send bulk request to Expo API
      const response = await axios.post(this.EXPO_URL, messages, {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Expo API Response:', response.data);

      this.logger.log(
        `Sent ${messages.length} notifications, got response: ${JSON.stringify(
          response.data,
        )}`,
      );
    } catch (error: any) {
      console.log('❌ ERROR sending push notification:', error.message);
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
      }
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );
      throw error;
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
