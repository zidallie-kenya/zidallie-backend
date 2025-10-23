import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { StudentsService } from '../students/students.service';
import { PaymentKind, TransactionType } from '../utils/types/enums';
import { PendingPaymentRepository } from './infrastructure/persistence/relational/repositories/pending_payment.repository';
import { PaymentRepository } from '../payments/infrastructure/persistence/payment.repository';
import { SubscriptionRepository } from './infrastructure/persistence/relational/repositories/subscription.repository';

@Injectable()
export class SubscriptionService {
    private readonly MPESA_BASEURL = process.env.MPESA_BASE_URL;

    constructor(
        private readonly pendingPaymentsRepository: PendingPaymentRepository,
        private readonly paymentsRepository: PaymentRepository,
        private readonly subscriptionsRepository: SubscriptionRepository,
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
        if (!stkCallback) throw new BadRequestException('Invalid callback data');

        if (stkCallback.ResultCode !== 0)
            throw new BadRequestException('Payment failed');

        const metadata = stkCallback.CallbackMetadata?.Item || [];
        const amount = metadata[0]?.Value;
        const phoneNumber = metadata[3]?.Value;
        const checkoutRequestID = stkCallback.CheckoutRequestID;

        // Find the pending payment
        const pending =
            await this.pendingPaymentsRepository.findByCheckoutId(checkoutRequestID);
        if (!pending) throw new BadRequestException('Pending payment not found');

        // Find the associated student
        const student = await this.studentsService.findById(pending.studentId);
        if (!student) throw new BadRequestException('Student not found');

        // Execute everything in a single transaction
        return await this.dataSource.transaction(async (manager) => {
            // --- Create subscription ---
            const subscription = await this.subscriptionsRepository.createSubscription(
                manager,
                student,
                phoneNumber,
            );

            // --- Record payment ---
            const payment = await this.paymentsRepository.create({
                user: { id: student.parent?.id } as any,
                amount,
                kind: PaymentKind.MPesa,
                transaction_type: TransactionType.Deposit,
                comments: 'Subscription payment via MPESA',
                transaction_id: checkoutRequestID,
            });

            // --- Remove pending payment ---
            await this.pendingPaymentsRepository.remove(pending);

            return {
                message: 'Subscription activated and payment recorded successfully.',
                subscription,
                payment,
            };
        });
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
}
