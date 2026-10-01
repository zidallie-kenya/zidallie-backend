/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Controller('webhook/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN || 'zidallie_secure_token_99';

  @Get()
  @HttpCode(200)
  verifyWebhook(@Query() query: any) {
    this.logger.log(
      `Received Meta verification query: ${JSON.stringify(query)}`,
    );

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === this.verifyToken) {
        this.logger.log('SUCCESS: WhatsApp Webhook verified by Meta!');
        // Returning a raw string makes NestJS send it directly with a 200 OK code
        return String(challenge);
      } else {
        this.logger.warn(`FAILED: Verify token mismatch. Received: "${token}"`);
        throw new ForbiddenException('Verify token mismatch');
      }
    }
    throw new BadRequestException('Invalid verification request');
  }

  @Post()
  @HttpCode(200)
  receiveWebhook(@Body() body: any) {
    this.logger.log(
      `Received WhatsApp Webhook Payload: ${JSON.stringify(body)}`,
    );

    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        const message = value.messages[0];
        this.logger.log(
          `Incoming WhatsApp message from ${message.from}: "${message.text?.body}"`,
        );
      }
    } catch (err: any) {
      this.logger.error(`Error parsing webhook body: ${err.message}`);
    }

    return { status: 'EVENT_RECEIVED' };
  }
}
