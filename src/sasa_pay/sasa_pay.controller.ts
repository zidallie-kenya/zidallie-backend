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
  InternalServerErrorException,
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

    const { accountNumber, accountStatus, description, displayName } = body;

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
          sasapay_onboarding_rejection_reason: null,
          payments: {
            ...user.meta?.payments,
            account_name: displayName,
          },
        },
      });
      console.log('wallet approved for user', user.id);
    } else {
      // Clear the sasapay account so the user can re-register
      await this.usersService.update(user.id, {
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

    try {
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
    } catch (error: any) {
      console.error('Error during onboarding initiation:', error.message);
      this.handleSasaPayError(error);
    }
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

      // We update sasapay_account_number and clear the tempRequestId
      await this.usersService.update(user.id, {
        sasapay_account_number: sasapayAccountNumber,
        meta: {
          ...user.meta,
          tempRequestId: null,
          tempPhoneNumber: null,
          payments: {
            kind: 'M-Pesa',
            bank: null,
            account_number: verifiedMpesaNumber,
            account_name: null,
          },
          sasapay_wallet_approval: false,
          sasapay_onboarding_rejection_reason: 'Pending KYC Verification',
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

    // Check if wallet is active and approved
    if (
      !user ||
      !user.sasapay_account_number ||
      !user.meta?.sasapay_wallet_approval
    ) {
      throw new BadRequestException('Wallet not active or awaiting approval');
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }

    // The user's M-Pesa number stored during registration
    const recipientMpesaNumber = user.meta?.payments?.account_number;

    if (!recipientMpesaNumber) {
      throw new BadRequestException('No verified M-Pesa number found.');
    }

    // 2. Call SasaPay service (assuming you add this method to your SasaPayService)
    const reference = `WD-${user.id}-${Date.now()}`;
    const result = await this.sasaPayService.transferToDriver(
      process.env.SASAPAY_MERCHANT_CODE!,
      amount,
      user.sasapay_account_number, // The wallet to debit (the driver's SasaPay account)
      recipientMpesaNumber, //mpesa number stored in user meta during registration
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

    try {
      const result = await this.sasaPayService.getWalletBalance(
        process.env.SASAPAY_MERCHANT_CODE!,
        user.sasapay_account_number,
      );

      const wallets = result.data?.CustomerWallets || [];
      const wallet = wallets.find(
        (w: any) => w.account_number === user.sasapay_account_number,
      );

      return {
        balance: wallet ? parseFloat(wallet.account_balance_derived) : 0,
        currency: wallet ? wallet.currency_code : 'KES',
      };
    } catch (error: any) {
      // This will now catch the error thrown from SasaPayService
      console.error(`Balance fetch failed for user ${user.id}:`, error.message);

      // If SasaPay says the account is invalid, return 400
      if (error.message.includes('not found')) {
        throw new BadRequestException('Wallet account not found in SasaPay');
      }

      throw new InternalServerErrorException(
        'Could not retrieve balance from SasaPay',
      );
    }
  }

  // Add this helper method inside PaymentsController
  private handleSasaPayError(error: any) {
    const data = error.response?.data;
    const code = data?.responseCode;
    const message =
      data?.message || 'An error occurred with the payment service';

    console.error(`SasaPay Error [${code}]: ${message}`);

    switch (code) {
      case 'SP8000':
        throw new BadRequestException('Insufficient wallet balance.');
      case 'SP4000': // Added this one as it's common for registrations
      case 'SP4090':
        throw new BadRequestException('This account is already registered.');
      case 'SP6000':
        throw new BadRequestException('Amount is below the minimum allowed.');
      case 'SP4045':
        throw new BadRequestException(
          'Account has incomplete KYC. Please verify your documents.',
        );
      case 'SP5030':
        throw new InternalServerErrorException(
          'SasaPay service is temporarily unavailable.',
        );
      default:
        throw new BadRequestException(message);
    }
  }
}
