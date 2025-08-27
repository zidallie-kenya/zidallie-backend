import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  async sendPushNotification(
    pushTokens: string | string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const messages = Array.isArray(pushTokens)
      ? pushTokens.map((token) => ({
          to: token,
          title,
          body,
          data,
          sound: 'default',
        }))
      : [{ to: pushTokens, title, body, data, sound: 'default' }];

    try {
      const response = await axios.post(this.expoPushUrl, messages, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      this.logger.log(`Expo push response: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
    }
  }
}
