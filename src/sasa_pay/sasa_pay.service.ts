import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class SasaPayService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Obtain these from your developer portal
  private readonly CLIENT_ID = process.env.SASAPAY_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.SASAPAY_CLIENT_SECRET;
  private readonly BASE_URL = 'https://sandbox.sasapay.app/api/v2/waas';
  // private readonly BASE_URL = 'https://api.sasapay.app/api/v2/waas';

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.CLIENT_ID}:${this.CLIENT_SECRET}`,
    ).toString('base64');

    const res = await axios.get(
      `${this.BASE_URL}/auth/token/?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    this.accessToken = res.data.access_token;
    console.log('Access token from sasa pay', this.accessToken);
    this.tokenExpiry = Date.now() + res.data.expires_in * 1000 - 60000; // Refresh 1 min early
    return this.accessToken!;
  }

  async initiateOnboarding(
    user: any,
    documentNumber: string,
    phone_number: string,
  ) {
    const token = await this.getAccessToken();
    const parts = user.name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];

    const payload = {
      merchantCode: process.env.SASAPAY_MERCHANT_CODE,
      firstName: firstName,
      middleName: '',
      lastName: lastName,
      countryCode: '254',
      mobileNumber: phone_number,
      documentNumber: documentNumber,
      documentType: '1',
      email: user.email,
      callbackUrl: `https://zidallie-backend.onrender.com/api/v1/sasa-pay/onboarding-callback`,
    };

    const res = await axios.post(
      `${this.BASE_URL}/personal-onboarding/`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log('Onboarding initiation response', res.data);
    return res.data; // Should return { requestId: "..." }
  }

  async confirmOnboarding(otp: string, requestId: string) {
    const token = await this.getAccessToken();
    const res = await axios.post(
      `${this.BASE_URL}/personal-onboarding/confirmation/`,
      {
        merchantCode: process.env.SASAPAY_MERCHANT_CODE,
        otp,
        requestId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return res.data;
  }

  /**
   * Transfers earnings from Merchant Wallet to Driver Wallet
   */
  async transferToDriver(
    merchantCode: string,
    amount: number,
    receiverNumber: string,
    reference: string,
  ) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.BASE_URL}/payments/merchant-transfers/`,
        {
          merchantCode,
          transactionReference: reference,
          currencyCode: 'KES',
          TransactionDesc: 'Driver Earnings Payout',
          amount: amount,
          reason: 'Earnings Payout',
          channel: '01', // 01 is SasaPay wallet
          receiverNumber: receiverNumber,
          callbackUrl: `${process.env.APP_URL}/v1/sasa-pay/callback`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;

      console.log(
        'SasaPay Transfer Error',
        err.response?.data ? JSON.stringify(err.response.data) : err.message,
      );
      throw error;
    }
  }

  /**
   * Check balance of a specific wallet
   */
  async getWalletBalance(merchantCode: string) {
    const token = await this.getAccessToken();
    const res = await axios.get(
      `${this.BASE_URL}/merchant-balances/?merchantCode=${merchantCode}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return res.data;
  }

  // sasa_pay.service.ts
  async getTransactionHistory(merchantCode: string, accountNumber: string) {
    const token = await this.getAccessToken();
    // Note: Use your actual production/sandbox endpoint as per documentation
    const res = await axios.get(
      `${this.BASE_URL}/transactions/?merchantCode=${merchantCode}&accountNumber=${accountNumber}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return res.data; // This returns the list of transactions
  }
}
