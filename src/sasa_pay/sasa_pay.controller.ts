import {
  Controller,
  Post,
  Body,
  UnprocessableEntityException,
  Req,
  NotFoundException,
  BadRequestException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { SasaPayService } from './sasa_pay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('SasaPay')
@Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
@Controller({ path: 'sasa-pay', version: '1' })
export class PaymentsController {
  constructor(
    private usersService: UsersService,
    private sasaPayService: SasaPayService,
  ) {}

  /**
   * Handles payment transfer callbacks (withdraw/payout results)
   * Payload: { ResultCode, ResultDesc, MerchantTransactionReference, ... }
   */
  @Post('callback')
  async handleCallback(@Body() body: any) {
    console.log('SasaPay Callback Received', body);

    const resultCode = String(body.ResultCode);

    if (resultCode === '0') {
      const reference = body.MerchantTransactionReference;

      // Add safety: Only reset if the reference is valid
      if (reference && reference.startsWith('PAYOUT-')) {
        const driverId = this.extractDriverId(reference);
        await this.usersService.resetPendingEarnings(driverId);
      }
    } else {
      // Log the error returned by SasaPay
      console.error('Payout failed in SasaPay:', body.ResultDesc);
    }
  }

  /**
   * Handles onboarding KYC callbacks from SasaPay.
   * SasaPay calls this after reviewing the beneficiary's KYC documents.
   * Payload: { merchantCode, displayName, accountNumber, accountStatus, description }
   *
   * By this point the user already has sasapay_account_number set (from /confirm),
   * so we can look them up and simply update is_kyc_verified.
   */
  @Post('onboarding-callback')
  async handleOnboardingCallback(@Body() body: any) {
    console.log('SasaPay Onboarding Callback Received', body);

    const { accountNumber, accountStatus, description } = body;

    // The user already has sasapay_account_number set from the /confirm step
    const user =
      await this.usersService.findBySasapayAccountNumber(accountNumber);

    if (!user) {
      console.error(
        'Onboarding callback: no user found for accountNumber',
        accountNumber,
      );
      // Always return 200 so SasaPay doesn't keep retrying
      return { received: true };
    }

    if (accountStatus === 'APPROVED') {
      await this.usersService.update(user.id, {
        meta: {
          ...user.meta,
          sasapay_wallet_approval: true,
          sasapay_onboarding_rejection_reason: 'Approved',
        },
      });
      console.log('wallet approved for user', user.id);
    } else if (accountStatus === 'REJECTED') {
      // Clear the sasapay account so the user can re-register
      await this.usersService.update(user.id, {
        sasapay_account_number: null,
        meta: {
          ...user.meta,
          sasapay_wallet_approval: false,
          sasapay_onboarding_rejection_reason: description,
        },
      });
      console.error(
        `wallet registration rejected for user ${user.id}. Reason: ${description}`,
      );
    }

    return { received: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('register')
  async register(
    @Body() body: { documentNumber: string; phone_number: string },
    @Req() req,
  ) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new NotFoundException('User not found');

    const result = await this.sasaPayService.initiateOnboarding(
      user,
      body.documentNumber,
      body.phone_number,
    );

    // Save requestId in user meta so we can use it during confirmation
    await this.usersService.update(user.id, {
      meta: {
        ...user.meta,
        tempRequestId: result.requestId,
        tempPhoneNumber: body.phone_number,
      },
    });

    console.log('otp sent to driver', result);
    return { message: 'OTP sent to driver', requestId: result.requestId };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('confirm')
  async confirm(@Req() req, @Body('otp') otp: string) {
    const user = await this.usersService.findById(req.user.id);

    if (!user || !user.meta?.tempRequestId) {
      throw new NotFoundException('No active registration request found.');
    }

    // 1. Confirm with SasaPay
    const result = await this.sasaPayService.confirmOnboarding(
      otp,
      user.meta.tempRequestId,
    );

    if (result.responseCode === '0') {
      // 2. Extract account number from the SasaPay response
      const sasapayAccountNumber = result.data.accountNumber;
      const verifiedMpesaNumber = user.meta.tempPhoneNumber;

      // 3. Update the database using your existing UsersService
      // We update sasapay_account_number and clear the tempRequestId
      await this.usersService.update(user.id, {
        sasapay_account_number: sasapayAccountNumber,
        meta: {
          ...user.meta,
          tempRequestId: null, // Clear the temp ID after success
          tempPhoneNumber: null, // Clear temp data
          payments: {
            kind: 'M-Pesa',
            bank: null,
            account_number: verifiedMpesaNumber, // <-- STORED SECURELY HERE FOREVER
            account_name: result.data.displayName,
          },
        },
      });
      console.log(
        'Wallet activated for user',
        user.id,
        'SasaPay Account:',
        sasapayAccountNumber,
      );
      return {
        message: 'Wallet activated successfully',
        account: sasapayAccountNumber,
      };
    } else {
      throw new UnprocessableEntityException(
        result.message || 'Verification failed',
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('withdraw')
  async withdraw(@Req() req, @Body('amount') amount: number) {
    const user = await this.usersService.findById(req.user.id);
    if (!user || !user.sasapay_account_number) {
      throw new BadRequestException('Wallet not active');
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }
    const verifiedMpesaNumber = user.meta?.payments?.account_number;

    if (!verifiedMpesaNumber) {
      throw new BadRequestException('No verified M-Pesa number found.');
    }

    // 2. Call SasaPay service (assuming you add this method to your SasaPayService)
    const reference = `WD-${user.id}-${Date.now()}`;
    const result = await this.sasaPayService.transferToDriver(
      process.env.SASAPAY_MERCHANT_CODE!,
      amount,
      verifiedMpesaNumber,
      reference,
    );

    // 3. Logic to update balance in your DB should be done in the callback handler
    console.log(
      'Withdrawal initiated for user',
      user.id,
      'Amount:',
      amount,
      'Reference:',
      reference,
    );
    return { message: 'Withdrawal request received', data: result };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('transactions')
  async getTransactions(@Req() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user?.sasapay_account_number)
      throw new NotFoundException('Wallet not active');

    try {
      const history = await this.sasaPayService.getTransactionHistory(
        process.env.SASAPAY_MERCHANT_CODE!,
        user.sasapay_account_number,
      );
      console.log('Transaction history for user', user.id, history.data);
      return history.data?.transactions || [];
    } catch (error) {
      console.log(error);
      console.warn(
        'Could not fetch transaction history from SasaPay. Returning empty list.',
      );
      return [];
    }
  }

  /**
   * Helper to parse the ID from the reference string
   * Reference format: "PAYOUT-{driverId}-{timestamp}"
   */
  private extractDriverId(reference: string): number {
    // Example: "PAYOUT-42-1714234567890" -> split("-") -> ["PAYOUT", "42", "1714234567890"]
    const parts = reference.split('-');
    if (parts.length < 2) {
      throw new Error('Invalid reference format');
    }
    return Number(parts[1]);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('balance')
  async getBalance(@Req() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user || !user.sasapay_account_number) {
      throw new NotFoundException('Wallet not active');
    }

    // Call SasaPay Service to get balance for this merchant code
    const result = await this.sasaPayService.getWalletBalance(
      process.env.SASAPAY_MERCHANT_CODE!,
    );

    // Filter the account balance for this specific driver
    // SasaPay returns an array of accounts, we find the one matching the driver
    const driverAccount = result.data.Accounts.find(
      (acc: any) =>
        acc.account_label === user.sasapay_account_number ||
        acc.account_label === user.phone_number,
    );

    return {
      balance: driverAccount ? driverAccount.account_balance : 0,
      currency: result.data.CurrencyCode,
    };
  }
}
