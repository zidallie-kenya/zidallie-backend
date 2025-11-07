import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Subscriptions')
@Roles(RoleEnum.parent)
@UseGuards(JwtAuthGuard) //  custom guard
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.initiateSubscription(dto);
  }

  @Post('express-callback')
  @Public()
  async expressCallback(@Req() req: Request) {
    return this.subscriptionService.handlePaymentCallback(req.body);
  }

  @Post('b2c-result')
  @Public()
  async b2cCallback(@Req() req: Request) {
    return this.subscriptionService.handleMpesaBusinessCallback(req.body);
  }
}
