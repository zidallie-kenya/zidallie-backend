import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { StudentsService } from '../students/students.service';
import { PaymentKind, TransactionType } from '../utils/types/enums';
import { PendingPaymentRepository } from './infrastructure/persistence/relational/repositories/pending_payment.repository';
import { PaymentRepository } from '../payments/infrastructure/persistence/payment.repository';
import { SubscriptionRepository } from './infrastructure/persistence/relational/repositories/subscription.repository';
import { SubscriptionPlanRepository } from './infrastructure/persistence/relational/repositories/subscriptionplan.repository';
const fs = require('fs');
const crypto = require('crypto');

@Injectable()
export class SubscriptionService {
    private readonly MPESA_BASEURL = process.env.MPESA_BASE_URL;

    constructor(
        private readonly pendingPaymentsRepository: PendingPaymentRepository,
        private readonly paymentsRepository: PaymentRepository,
        private readonly subscriptionsRepository: SubscriptionRepository,
        private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
        private readonly studentsService: StudentsService,
        private readonly dataSource: DataSource,
    ) { }

    // -------------------------------
    // INITIATE SUBSCRIPTION
    // -------------------------------
    async initiateSubscription(dto: CreateSubscriptionDto) {
        const student = await this.studentsService.findById(dto.student_id);
        if (!student) throw new BadRequestException('Student not found');

        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const secretKey = process.env.MPESA_SECRET_KEY;
        if (!consumerKey || !secretKey)
            throw new Error('Missing M-Pesa credentials in environment');

        const accessToken = await this.getAccessToken(consumerKey, secretKey);
        const timestamp = this.getTimestamp();
        const password = Buffer.from(
            `${process.env.MPESA_C2B_PAYBILL}${process.env.MPESA_PASS_KEY}${timestamp}`,
        ).toString('base64');

        const requestData = {
            BusinessShortCode: process.env.MPESA_C2B_PAYBILL,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: dto.amount,
            PartyA: dto.phone_number,
            PartyB: process.env.MPESA_C2B_PAYBILL,
            PhoneNumber: dto.phone_number,
            CallBackURL:
                'https://zidallie-backend.onrender.com/api/v1/subscriptions/express-callback',
            AccountReference: dto.phone_number,
            TransactionDesc: 'STUDENT SUBSCRIPTION',
        };

        try {
            const response = await axios.post(
                `${this.MPESA_BASEURL}/mpesa/stkpush/v1/processrequest`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const data = response.data;
            if (data.ResponseCode !== '0' && data.ResponseCode !== 0) {
                throw new BadRequestException(
                    data.ResponseDescription || 'MPESA Error',
                );
            }

            const pending =
                await this.pendingPaymentsRepository.createPendingPayment(
                    student.id,
                    dto.amount,
                    data.CheckoutRequestID,
                    dto.subscriptionPlanId
                );

            return {
                message: 'Payment initiated successfully. Complete on your phone.',
                pendingPayment: pending,
            };
        } catch (error) {
            console.error('MPESA STK Push Error:', error.response?.data || error.message);
            throw new BadRequestException('Failed to initiate payment');
        }
    }


    // -------------------------------
    // HANDLE CALLBACK
    // -------------------------------
    async handlePaymentCallback(receivedData: any) {
        const stkCallback = receivedData?.Body?.stkCallback;

        if (!stkCallback) {
            console.log('Received invalid M-Pesa callback.');
            return { ResultCode: 0, ResultDesc: 'Accepted' };
        }

        if (stkCallback.ResultCode !== 0) {
            console.log(`M-Pesa payment failed: ${stkCallback.ResultDesc}`);
            return { ResultCode: 0, ResultDesc: 'Accepted' };
        }

        const metadata = stkCallback.CallbackMetadata?.Item || [];
        const amount = metadata[0]?.Value;
        const checkoutRequestID = stkCallback.CheckoutRequestID;

        // Find pending payment
        const pending = await this.pendingPaymentsRepository.findByCheckoutId(checkoutRequestID);
        if (!pending) {
            console.log(`Pending payment not found for CheckoutRequestID: ${checkoutRequestID}`);
            return { ResultCode: 0, ResultDesc: 'Accepted' };
        }

        // Find student and subscription plan
        const student = await this.studentsService.findById(pending.studentId);
        const plan = await this.subscriptionPlanRepository.findById(pending.subscriptionPlanId);

        if (!student || !plan) {
            console.log(`Student or plan not found for pending payment id ${pending.id}`);
            return { ResultCode: 0, ResultDesc: 'Accepted' };
        }

        try {
            await this.dataSource.transaction(async (manager) => {
                // Create subscription
                await this.subscriptionsRepository.createSubscription(manager, student, plan, amount);

                // Record payment
                await this.paymentsRepository.create({
                    user: { id: student.parent?.id } as any,
                    amount,
                    kind: PaymentKind.MPesa,
                    transaction_type: TransactionType.Deposit,
                    comments: 'Subscription payment via MPESA',
                    transaction_id: checkoutRequestID,
                });

                // Remove pending payment
                await this.pendingPaymentsRepository.remove(pending);
            });

            console.log(`Payment processed successfully for CheckoutRequestID: ${checkoutRequestID}`);

            // DISBURSE FUNDS TO SCHOOL (16% of amount)
            // if (student.school?.disbursement_phone_number) {
            //     try {
            //         await this.disburseFunds(
            //             checkoutRequestID,
            //             student.school.disbursement_phone_number,
            //             0.16 * amount
            //         );
            //         console.log(`Funds disbursed to school: ${student.school.name}`);
            //     } catch (b2cError) {
            //         console.error('Error disbursing funds to school:', b2cError);
            //     }
            // }

            return { ResultCode: 0, ResultDesc: 'Accepted' };
        } catch (error) {
            console.error('Error processing payment callback:', error);
            return { ResultCode: 0, ResultDesc: 'Accepted' };
        }
    }

    // -------------------------------
    // DISBURSE FUNDS TO SCHOOL
    // -------------------------------
    private async disburseFunds(transactionId: string, phoneNumber: string, amount: number) {
        const B2C_CONSUMER_KEY = process.env.B2C_CONSUMER_KEY;
        const B2C_CONSUMER_SECRET_KEY = process.env.B2C_CONSUMER_SECRET_KEY;
        const BULK_SHORTCODE = process.env.BULK_SHORTCODE;
        const B2C_INITIATOR_NAME = process.env.B2C_INITIATOR_NAME;
        const B2C_INITIATOR_PASSWORD = process.env.B2C_INITIATOR_PASSWORD;
        const REMARKS = 'School disbursement';
        const COMMAND_ID = 'BusinessPayment';

        if (!B2C_CONSUMER_KEY || !B2C_CONSUMER_SECRET_KEY)
            throw new Error('Missing M-Pesa credentials in environment');

        const accessToken = await this.getAccessToken(B2C_CONSUMER_KEY, B2C_CONSUMER_SECRET_KEY);
        const securityCredential = await this.generateSecurityCredentials(B2C_INITIATOR_PASSWORD);
        const OriginatorConversationID = await this.generateReference(transactionId);

        const requestData = {
            InitiatorName: B2C_INITIATOR_NAME,
            SecurityCredential: securityCredential,
            CommandID: COMMAND_ID,
            Amount: amount,
            PartyA: BULK_SHORTCODE,
            PartyB: parseInt(phoneNumber),
            Remarks: REMARKS,
            QueueTimeOutURL: `${process.env.BACKEND_DOMAIN}/api/v1/subscriptions/b2c-timeout`,
            ResultURL: `${process.env.BACKEND_DOMAIN}/api/v1/subscriptions/mpesa-b2c-result`,
            Occassion: 'Disbursement',
            OriginatorConversationID,
        };

        const url = `${this.MPESA_BASEURL}/mpesa/b2c/v3/paymentrequest`;

        try {
            const response = await axios.post(url, requestData, {
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            });
            return response.data;
        } catch (error) {
            console.error('B2C disbursement error:', error.response?.data || error.message);
            throw new Error('Failed to disburse funds to school');
        }
    }


    // -------------------------------
    // HELPER: Get access token
    // -------------------------------
    private async getAccessToken(consumerKey: string, secretKey: string) {
        const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString('base64');
        try {
            const response = await axios.get(
                `${this.MPESA_BASEURL}/oauth/v3/generate?grant_type=client_credentials`,
                { headers: { Authorization: `Basic ${auth}` } },
            );
            return response.data.access_token;
        } catch (error) {
            console.error('Access token error:', error.response?.data || error.message);
            throw new BadRequestException('Failed to get MPESA access token');
        }
    }

    private getTimestamp(): string {
        const date = new Date();
        return (
            date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0') +
            String(date.getSeconds()).padStart(2, '0')
        );
    }


    //generate b2c security credentials
    private async generateSecurityCredentials(password) {
        try {
            const certPath = 'assets/certs/ProductionCertificate.cer';
            // Read the certificate file
            const cert = fs.readFileSync(certPath, 'utf8');

            // Encrypt the password using the public key
            const encryptedBuffer = crypto.publicEncrypt(
                {
                    key: cert,
                    padding: crypto.constants.RSA_PKCS1_PADDING,
                },
                Buffer.from(password)
            );

            // Convert to base64
            return encryptedBuffer.toString('base64');
        } catch (error) {
            console.error('Error generating security credentials:', error);
            throw error;
        }
    }



    //generate reference number
    private async generateReference(loan_id) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        // Generate the first random part (5 digits)
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        // Generate the second random part (8 digits)
        let middlePart = '';
        for (let i = 0; i < 8; i++) {
            middlePart += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        // Combine everything in the format: "XXXXX-XXXXXXXX-transaction_id"
        return `${result}-${middlePart}-${loan_id}`;
    };
}
