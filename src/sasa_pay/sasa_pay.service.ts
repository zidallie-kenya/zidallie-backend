import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class SasaPayService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Obtain these from your developer portal
  private readonly CLIENT_ID = process.env.SASAPAY_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.SASAPAY_CLIENT_SECRET;
  private readonly SASA_BASE_URL = process.env.SASA_BASE_URL;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.CLIENT_ID}:${this.CLIENT_SECRET}`,
    ).toString('base64');

    const res = await axios.get(
      `${this.SASA_BASE_URL}/auth/token/?grant_type=client_credentials`,
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

    const nameParts = (user.name || 'Zidallie Customer').trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName =
      nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'User';
    const middleName = nameParts.length > 2 ? nameParts[1] : '';

    const payload = {
      merchantCode: process.env.SASAPAY_MERCHANT_CODE,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      countryCode: '254',
      mobileNumber: phone_number,
      documentNumber: documentNumber,
      documentType: '1',
      email: user.email,
      callbackUrl: `https://zidallie-backend.onrender.com/api/v1/sasa-pay/onboarding-callback`,
    };

    console.log('Final Payload Sent to SasaPay:', JSON.stringify(payload));

    try {
      const res = await axios.post(
        `${this.SASA_BASE_URL}/personal-onboarding/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.data;
    } catch (error: any) {
      if (error.response) {
        console.error(
          'SasaPay SP4000 Detail:',
          JSON.stringify(error.response.data),
        );
      }
      throw error;
    }
  }

  async confirmOnboarding(otp: string, requestId: string) {
    const token = await this.getAccessToken();
    const res = await axios.post(
      `${this.SASA_BASE_URL}/personal-onboarding/confirmation/`,
      {
        merchantCode: process.env.SASAPAY_MERCHANT_CODE,
        otp,
        requestId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log(res.data);
    return res.data;
  }

  /**
   * Transfers earnings from wallet to MPESA
   */
  async transferToDriver(
    merchantCode: string,
    amount: number,
    senderAccountNumber: string,
    receiverNumber: string,
    reference: string,
  ) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.SASA_BASE_URL}/payments/send-money/`,
        {
          merchantCode,
          transactionReference: reference,
          currencyCode: 'KES',
          TransactionDesc: 'Driver Earnings Payout',
          senderNumber: senderAccountNumber, // The wallet being charged
          amount: amount.toFixed(2), // API expects string, 2 decimal places
          reason: 'Earnings Payout',
          chargeAccount: senderAccountNumber, // Usually the beneficiary wallet
          transactionFee: '0.00', // Adjust based on your business logic
          channel: '01', // 01 = M-PESA
          receiverNumber: receiverNumber,
          callbackUrl: `${process.env.APP_URL}/api/v1/sasa-pay/callback`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log('Transfer Response:', response.data);
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
  async getWalletBalance(merchantCode: string, accountNumber: string) {
    try {
      const token = await this.getAccessToken();

      const res = await axios.post(
        `${this.SASA_BASE_URL}/customer-details/`,
        {
          merchantCode,
          accountNumber,
          countryCode: '254',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // SasaPay often returns a "success" status but with non-zero responseCodes
      if (res.data.statusCode !== 0 && res.data.status !== true) {
        throw new Error(
          res.data.message || 'Failed to retrieve customer details',
        );
      }

      return res.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'SasaPay API Error';
      console.error(`SasaPay [getCustomerDetails] Error: ${message}`);
      // Throw a standard Error that the Controller can catch
      throw new Error(message);
    }
  }

  async getTransactionHistory(merchantCode: string, accountNumber: string) {
    try {
      const token = await this.getAccessToken();
      const res = await axios.get(
        `${this.SASA_BASE_URL}/transactions/?merchantCode=${merchantCode}&accountNumber=${accountNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log(res.data);
      return res.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        'SasaPay Get Transactions Error:',
        err.response?.status,
        err.response?.data ? JSON.stringify(err.response.data) : err.message,
      );
    }
  }
}
