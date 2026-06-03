import {
  Controller,
  Post,
  Body,
  Req,
  NotFoundException,
  BadRequestException,
  Get,
  UseGuards,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { SasaPayService } from './sasa_pay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

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
    console.log('============================================');
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
      console.log(
        `Onboarding approved for user ${user.id}. Updating wallet approval status.`,
      );
      console.log('============================================');

      await this.usersService.update(user.id, {
        meta: {
          ...user.meta,
          tempRequestId: null,
          tempPhoneNumber: null,
          payments: {
            ...user.meta?.payments,
            account_name: displayName,
          },
          sasapay_wallet_approval: true,
          sasapay_onboarding_rejection_reason: null,
        },
      });
      console.log('wallet approved for user', user.id);
    } else {
      // Clear the sasapay account so the user can re-register
      console.log(
        `Onboarding rejected for user ${user.id}. Reason: ${description}`,
      );
      console.log('============================================');
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
    @Body()
    body: { documentNumber: string; phone_number: string; name: string },
    @Req() req,
  ) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new NotFoundException('User not found');

    try {
      const result = await this.sasaPayService.initiateOnboarding(
        user,
        body.documentNumber,
        body.phone_number,
        body.name,
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

    const description = result.message;

    if (result.responseCode === '0') {
      // 2. Extract account number from the SasaPay response
      const sasapayAccountNumber = result.data.accountNumber;
      const verifiedMpesaNumber = user.meta.tempPhoneNumber;
      const displayName = result.data.displayName;

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
            account_name: displayName,
          },
          sasapay_wallet_approval: true,
          sasapay_onboarding_rejection_reason: null,
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
      await this.usersService.update(user.id, {
        meta: {
          ...user.meta,
          sasapay_wallet_approval: false,
          sasapay_onboarding_rejection_reason: description,
        },
      });

      console.error(result.message || 'Verification failed');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('withdraw')
  async withdraw(
    @Req() req,
    @Body('amount') amount: number,
    @Body('phone_number') phone_number: string,
  ) {
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

    const recipientMpesaNumber = phone_number;
    if (!recipientMpesaNumber) {
      throw new BadRequestException('No verified M-Pesa number found.');
    }
    try {
      const profile_result = await this.sasaPayService.getDriversProfile(
        process.env.SASAPAY_MERCHANT_CODE!,
        user.sasapay_account_number,
      );

      const account_status = profile_result.data?.profile?.account_status;

      if (account_status !== 'ACTIVE') {
        await this.usersService.update(user.id, {
          meta: { ...user.meta, kyc_submitted: false },
        });
        console.log(
          `User ${user.id} has rejected KYC. Prompting re-upload of documents.`,
        );
        return {
          message:
            'Your wallet KYC was rejected. Please re-upload your documents for verification.',
          rejected: true,
        };
      }

      const reference = `WD-${user.id}-${Date.now()}`;
      const result = await this.sasaPayService.transferToDriver(
        process.env.SASAPAY_MERCHANT_CODE!,
        amount,
        user.sasapay_account_number, // The wallet to debit (the driver's SasaPay account)
        recipientMpesaNumber, //mpesa number stored in user meta during registration
        reference,
      );

      console.log(
        'Withdrawal initiated for user',
        user.id,
        'Amount:',
        amount,
        'Reference:',
        reference,
      );
      return {
        message: 'Withdrawal request received',
        data: result,
        rejected: false,
      };
    } catch (error: any) {
      console.error('Error during withdrawal:', error.message);
      this.handleSasaPayError(error);
    }
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
      const result = await this.sasaPayService.getDriversProfile(
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('upload-kyc')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'id_front', maxCount: 1 },
      { name: 'id_back', maxCount: 1 },
      { name: 'passport_photo', maxCount: 1 },
    ]),
  )
  async uploadKyc(@Req() req, @UploadedFiles() files: any) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new NotFoundException('User not found');

    const phone_number = user.meta?.payments?.account_number;

    if (!phone_number) {
      throw new BadRequestException(
        'No verified phone number found for user. Please complete registration first.',
      );
    }

    if (!files.id_front || !files.id_back || !files.passport_photo) {
      throw new BadRequestException(
        'All 3 images (ID Front, ID Back, Photo) are required.',
      );
    }

    const result = await this.sasaPayService.uploadKycDocuments(
      phone_number,
      files.id_front[0].buffer,
      files.id_back[0].buffer,
      files.passport_photo[0].buffer,
    );

    if (result.responseCode === '0') {
      console.log('KYC documents uploaded for user', user.id);
      await this.usersService.update(user.id, {
        meta: { ...user.meta, kyc_submitted: true },
      });
      return {
        message:
          'KYC documents submitted successfully. Verification takes 24-48 hours.',
      };
    } else {
      throw new BadRequestException(result.message);
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
