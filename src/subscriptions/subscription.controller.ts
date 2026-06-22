import { Controller, Post, Body, Req, UseGuards, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Subscriptions')
@Roles(RoleEnum.parent)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.initiatePayment(dto);
  }

  @Post('express-callback')
  @Public()
  expressCallback(@Req() req: Request, @Res() res: Response) {
    const checkoutRequestID =
      req.body?.Body?.stkCallback?.CheckoutRequestID ?? 'unknown';

    // ✅ Acknowledge M-Pesa immediately — must respond before their ~10s timeout to prevent duplicate retries
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    // ✅ Process in background — fire and forget
    this.subscriptionService
      .handlePaymentCallback(req.body)
      .catch((err: any) => {
        console.log(
          `Background callback processing failed for ${checkoutRequestID}: ${err.message}`,
        );
      });
  }

  @Post('b2c-result')
  @Public()
  b2cCallback(@Req() req: Request, @Res() res: Response) {
    const transactionID = req.body?.Result?.TransactionID ?? 'unknown';

    // ✅ acknowledge Safaricom immediately
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    this.subscriptionService
      .handleMpesaBusinessCallback(req.body)
      .catch((err: any) => {
        console.log(
          `Background B2C callback processing failed for ${transactionID}: ${err.message}`,
        );
      });
  }

  // @Post('express-callback')
  // @Public()
  // async expressCallback(@Req() req: Request) {
  //   return this.subscriptionService.handlePaymentCallback(req.body);
  // }

  // @Post('b2c-result')
  // @Public()
  // async b2cCallback(@Req() req: Request) {
  //   return this.subscriptionService.handleMpesaBusinessCallback(req.body);
  // }
}
