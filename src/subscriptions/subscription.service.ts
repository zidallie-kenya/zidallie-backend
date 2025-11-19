import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { StudentsService } from '../students/students.service';
import { SchoolsService } from '../schools/schools.service';
import { PendingPaymentRepository } from './infrastructure/persistence/relational/repositories/pending_payment.repository';
import { SubscriptionRepository } from './infrastructure/persistence/relational/repositories/subscription.repository';
import { B2cMpesaTransactionRepository } from './infrastructure/persistence/relational/repositories/b2c_mpesa_transaction.repository';
import { CreateB2cMpesaTransactionDto } from './dto/create-b2c-mpesa-transaction.dto';
import fs from 'fs';
import crypto from 'crypto';
import { PaymentTermRepository } from './infrastructure/persistence/relational/repositories/payment_term.repository';
import { TermCommissionRepository } from './infrastructure/persistence/relational/repositories/term_commisson.repository';
import { StudentPaymentRepository } from './infrastructure/persistence/relational/repositories/student_payment.repository';
import { SchoolDisbursementRepository } from './infrastructure/persistence/relational/repositories/school_disbursement.repository';
import { PendingPaymentEntity } from './infrastructure/persistence/relational/entities/pending_payment.entity';

@Injectable()
export class SubscriptionService {
  private readonly MPESA_BASEURL = process.env.MPESA_BASE_URL;

  constructor(
    private readonly pendingPaymentsRepository: PendingPaymentRepository,
    private readonly subscriptionsRepository: SubscriptionRepository,
    private readonly paymentTermRepository: PaymentTermRepository,
    private readonly termCommissionRepository: TermCommissionRepository,
    private readonly studentPaymentRepository: StudentPaymentRepository,
    private readonly schoolDisbursementRepository: SchoolDisbursementRepository,
    private readonly b2cMpesaTransactionRepository: B2cMpesaTransactionRepository,
    private readonly studentsService: StudentsService,
    private readonly schoolsService: SchoolsService,
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------------
  // INITIATE PAYMENT
  // -------------------------------
  async initiatePayment(dto: CreateSubscriptionDto) {
    const student = await this.studentsService.findById(dto.student_id);
    if (!student) throw new BadRequestException('Student not found');

    // Route based on service_type
    if (student.service_type === 'school') {
      if (!student.school)
        throw new BadRequestException(
          'Student is not associated with a school',
        );
      const school = await this.schoolsService.findById(student.school.id);
      if (!school) throw new BadRequestException('School not found');

      // returns null if no active term
      const activeTerm = await this.paymentTermRepository.getActiveTerm(
        school.id,
      );
      return this.handleSchoolPayment(
        student,
        dto.phone_number,
        dto.amount,
        activeTerm,
        school,
      );
    } else if (
      student.service_type === 'carpool' ||
      student.service_type === 'private'
    ) {
      // const activeTerm = await this.paymentTermRepository.getZidallieTerm();
      return this.handleCarpoolPrivatePayment(
        student,
        dto.phone_number,
        dto.amount,
        // activeTerm,
      );
    } else {
      throw new BadRequestException('Invalid service type');
    }
  }

  // -------------------------------
  // SCHOOL PAYMENT HANDLER
  // -------------------------------
  // Fixed handleSchoolPayment method
  private async handleSchoolPayment(
    student,
    phoneNumber,
    amount,
    term,
    school,
  ) {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const secretKey = process.env.MPESA_SECRET_KEY;
    if (!consumerKey || !secretKey)
      throw new Error('Missing M-Pesa credentials');

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
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_C2B_PAYBILL,
      PhoneNumber: phoneNumber,
      CallBackURL:
        'https://zidallie-backend.onrender.com/api/v1/subscriptions/express-callback',
      AccountReference: phoneNumber,
      TransactionDesc: 'STUDENT SUBSCRIPTION',
    };

    console.log('M-Pesa Request Data:', requestData);

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

      // Check for active subscription
      const activeSubscription =
        await this.subscriptionsRepository.findActiveByStudentId(student.id);

      if (!activeSubscription) {
        console.log('No active subscription found for student:', student.id);
        throw new BadRequestException(
          'No active subscription found for the student. Please contact support.',
        );
      }

      let pending;

      if (!school.has_commission) {
        // Daily/Weekly/Monthly payment model
        const paymentType = this.determinePeriod(amount, student.daily_fee);

        pending = await this.pendingPaymentsRepository.createPendingPayment({
          studentId: student.id,
          amount,
          checkoutId: data.CheckoutRequestID,
          phoneNumber,
          paymentType,
          paymentModel: 'daily',
          schoolId: school.id,
          termId: null,
        });

        console.log('Daily payment pending record created:', pending.id);
      } else {
        // Term-based payment model
        if (!term) {
          throw new BadRequestException(
            'No active term found for the school. Cannot process payment.',
          );
        }

        // Check if student has already paid full amount for this term
        if (
          activeSubscription.balance === 0 &&
          activeSubscription.total_paid >= student.transport_term_fee
        ) {
          throw new BadRequestException(
            'Student has already paid full amount for this term',
          );
        }

        const paymentType =
          activeSubscription.total_paid === 0 ? 'initial' : 'installment';

        pending = await this.pendingPaymentsRepository.createPendingPayment({
          studentId: student.id,
          termId: term.id,
          amount,
          checkoutId: data.CheckoutRequestID,
          phoneNumber,
          paymentType,
          paymentModel: 'term',
          schoolId: school.id,
        });

        console.log('Term payment pending record created:', pending.id);
      }

      return {
        message: 'Payment initiated successfully',
        pendingPayment: pending,
        checkoutRequestId: data.CheckoutRequestID,
      };
    } catch (error) {
      console.error(
        'MPESA STK Push Error:',
        error.response?.data || error.message,
      );

      // Re-throw BadRequestException as is
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Failed to initiate payment. Please try again.',
      );
    }
  }

  // -------------------------------
  // CARPOOL/PRIVATE PAYMENT HANDLER
  // -------------------------------
  private async handleCarpoolPrivatePayment(student, phoneNumber, amount) {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const secretKey = process.env.MPESA_SECRET_KEY;
    if (!consumerKey || !secretKey)
      throw new Error('Missing M-Pesa credentials');

    const subscription =
      await this.subscriptionsRepository.findActiveByStudentId(student.id);

    if (!subscription) {
      console.log('subcription not found');
      throw new BadRequestException(
        'No active subscription found for the student',
      );
    }

    if (
      subscription.balance === 0 &&
      subscription.total_paid >= student.transport_term_fee
    ) {
      throw new BadRequestException(
        'Student has already paid full amount for this term',
      );
    }

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
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_C2B_PAYBILL,
      PhoneNumber: phoneNumber,
      CallBackURL:
        'https://zidallie-backend.onrender.com/api/v1/subscriptions/express-callback',
      AccountReference: phoneNumber,
      TransactionDesc: 'CARPOOL/PRIVATE SUBSCRIPTION',
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

      const pending = await this.pendingPaymentsRepository.createPendingPayment(
        {
          studentId: student.id,
          termId: null,
          amount,
          checkoutId: data.CheckoutRequestID,
          phoneNumber,
          paymentType: 'termly',
          paymentModel: 'zidallie',
          schoolId: null,
        },
      );

      return { message: 'Payment initiated', pendingPayment: pending };
    } catch (error) {
      console.error(
        'MPESA STK Push Error:',
        error.response?.data || error.message,
      );
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
    const phoneNumber = metadata[1]?.Value;

    const pending_payment =
      await this.pendingPaymentsRepository.findByCheckoutId(checkoutRequestID);

    if (!pending_payment) {
      console.log(
        `Pending payment not found for CheckoutRequestID: ${checkoutRequestID}`,
      );
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    const student = await this.studentsService.findById(
      pending_payment.studentId,
    );
    if (!student) {
      console.log(
        `Student not found for pending payment id ${pending_payment.id}`,
      );
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    // Route based on schoolId and payment model
    if (!student.school) {
      // Carpool/Private
      await this.processCarpoolPrivatePayment(
        pending_payment,
        checkoutRequestID,
        phoneNumber,
        amount,
        student,
      );
    } else {
      const school = await this.schoolsService.findById(student.school.id);
      if (!school) {
        console.log(`School not found for student id ${student.id}`);
        return { ResultCode: 0, ResultDesc: 'Accepted' };
      }
      if (!school.has_commission) {
        // Daily Payment Model
        await this.processSchoolBusDailyPayment(
          pending_payment,
          checkoutRequestID,
          phoneNumber,
          amount,
          student,
          school,
        );
      } else {
        // Term Payment Model
        await this.processSchoolBusTermPayment(
          pending_payment,
          checkoutRequestID,
          phoneNumber,
          amount,
          student,
          school,
        );
      }
    }

    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  // -------------------------------
  // PROCESS SCHOOL BUS - DAILY PAYMENT
  // -------------------------------
  private async processSchoolBusDailyPayment(
    pending_payment,
    transactionId: string,
    phoneNumber: string,
    amount: number,
    student,
    school,
  ) {
    try {
      console.log('Reached processSchoolBusDailyPayment');

      const amt = Number(amount);
      const dailyFee = Number(student.daily_fee);

      if (isNaN(amt) || isNaN(dailyFee) || dailyFee <= 0) {
        console.error('Invalid amount or daily fee:', { amt, dailyFee });
        return;
      }

      const daysPaidFor = Math.floor(amt / dailyFee);
      if (daysPaidFor <= 0) {
        console.error('Amount too small to cover any days:', { amt, dailyFee });
        return;
      }

      let studentPayment;

      await this.dataSource.transaction(async (manager) => {
        console.log('Transaction started');

        console.log('Recording student payment');
        studentPayment = await this.studentPaymentRepository.create(manager, {
          student,
          termId: null,
          transaction_id: transactionId,
          phone_number: phoneNumber,
          amount_paid: amt,
          payment_type: pending_payment.paymentType || 'daily',
        });
        console.log('Student payment recorded');

        console.log(
          'Fetching active subscription entity for student',
          student.id,
        );
        const subscriptionEntity =
          await this.subscriptionsRepository.findActiveEntityByStudentId(
            student.id,
          );

        if (!subscriptionEntity) {
          console.error('No active subscription found for student', student.id);
          return;
        }
        console.log('Subscription entity found', subscriptionEntity.id);

        const currentDate = new Date();
        let startDate = currentDate;
        if (
          subscriptionEntity.expiry_date &&
          subscriptionEntity.expiry_date > currentDate
        ) {
          startDate = subscriptionEntity.expiry_date;
        }
        console.log('Start date for new access:', startDate);

        const expiryDate = this.calculateExpiryDateExcludingWeekends(
          startDate,
          daysPaidFor,
        );
        console.log('Calculated expiry date:', expiryDate);

        subscriptionEntity.total_paid += amt;
        subscriptionEntity.expiry_date = expiryDate;
        subscriptionEntity.last_payment_date = new Date();
        subscriptionEntity.status = 'active';
        subscriptionEntity.days_access = daysPaidFor;

        console.log('Saving subscription entity');
        await manager.save(subscriptionEntity);
        console.log('Subscription entity saved');

        console.log('Removing pending payment', pending_payment.id);
        await manager.remove(PendingPaymentEntity, pending_payment);
        console.log('Pending payment removed');
      });

      // MOVE DISBURSEMENT OUTSIDE THE TRANSACTION
      if (amt > 0 && studentPayment) {
        console.log('Disbursing to school', amt);
        await this.disburseToSchool(
          school,
          student,
          studentPayment,
          amt,
          pending_payment.termId,
        );
      }

      console.log(`Daily payment processed successfully: ${transactionId}`);
    } catch (error) {
      console.error('Error processing daily payment:', error);
    }
  }

  // -------------------------------
  // PROCESS SCHOOL BUS - TERM PAYMENT
  // -------------------------------
  private async processSchoolBusTermPayment(
    pending_payment,
    transactionId: string,
    phoneNumber: string,
    amount: number,
    student,
    school,
  ) {
    try {
      console.log('Reached processSchoolBusTermPayment');

      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        console.error('Invalid payment amount:', amt);
        return;
      }

      let studentPayment;
      let amountToDisburse = 0;

      await this.dataSource.transaction(async (manager) => {
        console.log('Transaction started for term payment');

        // Fetch the active subscription entity
        console.log(
          'Fetching active subscription entity for student',
          student.id,
        );
        const subscriptionEntity =
          await this.subscriptionsRepository.findActiveEntityByStudentId(
            student.id,
          );

        if (!subscriptionEntity) {
          console.error('No active subscription found for student', student.id);
          throw new BadRequestException(
            'No active subscription found for the student',
          );
        }
        console.log('Subscription entity found', subscriptionEntity.id);

        // Get or create term commission
        const termCommission = await this.termCommissionRepository.getOrCreate(
          manager,
          {
            student,
            termId: pending_payment.termId,
            commissionAmount: school.commission_amount,
          },
        );
        console.log('Term commission:', termCommission);

        // Record student payment
        console.log('Recording student payment for term');
        studentPayment = await this.studentPaymentRepository.create(manager, {
          student,
          termId: pending_payment.termId,
          transaction_id: transactionId,
          phone_number: phoneNumber,
          amount_paid: amt,
          payment_type: pending_payment.paymentType || 'initial',
        });
        console.log('Student payment recorded:', studentPayment.id);

        // Calculate amount to disburse to school
        amountToDisburse = amt;
        if (!termCommission.isPaid) {
          if (amt >= school.commission_amount) {
            amountToDisburse = amt - school.commission_amount;
            termCommission.isPaid = true;
            termCommission.paidAt = new Date();
            await this.termCommissionRepository.save(manager, termCommission);
            console.log('Term commission marked as paid');
          } else {
            amountToDisburse = 0;
          }
        }

        // Fetch term entity
        const term = await this.paymentTermRepository.findById(
          pending_payment.termId,
        );
        if (!term) {
          console.error(
            'Term not found for pending payment',
            pending_payment.id,
          );
          throw new BadRequestException('No active term found for the student');
        }

        // Update subscription entity
        subscriptionEntity.total_paid += amt;
        subscriptionEntity.balance =
          student.transport_term_fee - subscriptionEntity.total_paid;
        subscriptionEntity.is_commission_paid = termCommission.isPaid;
        subscriptionEntity.last_payment_date = new Date();

        if (subscriptionEntity.balance <= 0) {
          subscriptionEntity.status = 'fully_paid';
          subscriptionEntity.expiry_date = term.endDate;
        } else {
          subscriptionEntity.status = 'partially_paid';
        }

        console.log('Saving subscription entity');
        await manager.save(subscriptionEntity);
        console.log('Subscription entity saved');

        // Remove pending payment using transaction manager
        console.log('Removing pending payment', pending_payment.id);
        await manager.remove(PendingPaymentEntity, pending_payment);
        console.log('Pending payment removed');
      });

      // Disburse AFTER transaction commits
      if (amountToDisburse > 0 && studentPayment) {
        console.log('Disbursing to school', amountToDisburse);
        await this.disburseToSchool(
          school,
          student,
          studentPayment,
          amountToDisburse,
          pending_payment.termId,
        );
        console.log('Disbursement completed');
      }

      console.log(`Term payment processed successfully: ${transactionId}`);
    } catch (error) {
      console.error('Error processing term payment:', error);
    }
  }

  // -------------------------------
  // PROCESS CARPOOL/PRIVATE PAYMENT
  // -------------------------------
  private async processCarpoolPrivatePayment(
    pending_payment,
    transactionId: string,
    phoneNumber: string,
    amount: number,
    student,
  ) {
    try {
      console.log('Reached processCarpoolPrivatePayment');

      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        console.error('Invalid payment amount:', amt);
        return;
      }

      await this.dataSource.transaction(async (manager) => {
        console.log('Transaction started for carpool/private payment');

        // Fetch term
        const term = await this.paymentTermRepository.findById(
          pending_payment.termId,
        );
        if (!term) {
          console.error(
            'Term not found for pending payment',
            pending_payment.id,
          );
          throw new BadRequestException('No active term found for the student');
        }

        // Record student payment
        console.log('Recording student payment for carpool/private');
        const studentPayment = await this.studentPaymentRepository.create(
          manager,
          {
            student,
            termId: pending_payment.termId,
            transaction_id: transactionId,
            phone_number: phoneNumber,
            amount_paid: amt,
            payment_type: pending_payment.paymentType || 'installment',
          },
        );
        console.log('Student payment recorded:', studentPayment.id);

        // Fetch active subscription entity
        console.log(
          'Fetching active subscription entity for student',
          student.id,
        );
        const subscriptionEntity =
          await this.subscriptionsRepository.findActiveEntityByStudentId(
            student.id,
          );

        if (!subscriptionEntity) {
          console.error('No active subscription found for student', student.id);
          throw new BadRequestException(
            'No active subscription found for the student',
          );
        }

        // Update subscription details
        subscriptionEntity.total_paid =
          (subscriptionEntity.total_paid || 0) + amt;
        subscriptionEntity.balance = Math.max(
          (student.transport_term_fee || 0) - subscriptionEntity.total_paid,
          0,
        );
        subscriptionEntity.last_payment_date = new Date();

        if (subscriptionEntity.balance <= 0) {
          subscriptionEntity.status = 'fully_paid';
          subscriptionEntity.expiry_date = term.endDate;
        } else {
          subscriptionEntity.status = 'partially_paid';
        }

        console.log('Saving subscription entity');
        await manager.save(subscriptionEntity);
        console.log('Subscription entity saved');

        // Remove pending payment
        console.log('Removing pending payment', pending_payment.id);
        await manager.remove(PendingPaymentEntity, pending_payment);
        console.log('Pending payment removed');
      });

      console.log(
        `Carpool/Private payment processed successfully: ${transactionId}`,
      );
    } catch (error) {
      console.error(
        `Error processing carpool/private payment for studentId ${student.id}:`,
        error,
      );
    }
  }

  // -------------------------------
  // DISBURSE TO SCHOOL
  // -------------------------------
  private async disburseToSchool(school, student, payment, amount, termId) {
    try {
      if (school.disbursement_phone_number) {
        // B2C to phone
        const response = await this.disburseFunds(
          payment.transaction_id,
          school.disbursement_phone_number,
          amount,
        );

        await this.schoolDisbursementRepository.create({
          student,
          termId,
          payment,
          bank_paybill: null,
          account_number: null,
          amount_disbursed: amount,
          disbursement_type: 'B2C',
          transaction_id: response.ConversationID,
          status: 'pending',
        });

        console.log(`B2C disbursement initiated to: ${school.name}`);
      } else if (school.bank_account_number && school.bank_paybill_number) {
        // B2B to bank
        const response = await this.disbursebankFunds(
          payment.transaction_id,
          school.bank_paybill_number,
          school.bank_account_number,
          amount,
        );

        await this.schoolDisbursementRepository.create({
          student,
          termId: termId || null,
          payment,
          bank_paybill: school.bank_paybill_number,
          account_number: school.bank_account_number,
          amount_disbursed: amount,
          disbursement_type: 'B2B',
          transaction_id: response.ConversationID,
          status: 'pending',
        });

        console.log(`B2B disbursement initiated to: ${school.name}`);
      } else {
        console.warn(`No valid disbursement method for school: ${school.name}`);
      }
    } catch (error) {
      console.error('Error disbursing funds:', error);
    }
  }

  // -------------------------------
  // HELPER: Calculate expiry excluding weekends
  // -------------------------------
  private calculateExpiryDateExcludingWeekends(
    startDate: Date,
    daysToAdd: number,
  ): Date {
    const currentDate = new Date(startDate);
    let weekdaysAdded = 0;

    while (weekdaysAdded < daysToAdd) {
      currentDate.setDate(currentDate.getDate() + 1);

      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdaysAdded++;
      }
    }

    return currentDate;
  }

  // -------------------------------
  // HELPER: Determine payment period
  // -------------------------------
  private determinePeriod(
    amount: number,
    dailyFee: number,
  ): 'daily' | 'weekly' | 'monthly' {
    const days = amount / dailyFee;
    if (days <= 7) return 'daily';
    if (days <= 30) return 'weekly';
    return 'monthly';
  }

  // -------------------------------
  // HANDLE M-PESA BUSINESS CALLBACK
  // -------------------------------
  async handleMpesaBusinessCallback(receivedData: any) {
    console.log('Received M-Pesa B2C/B2B callback');

    try {
      if (!receivedData?.Result) {
        console.warn('Invalid M-Pesa callback payload:', receivedData);
        return { ResultCode: 0, ResultDesc: 'Accepted' };
      }

      const result = receivedData.Result;

      const dto: CreateB2cMpesaTransactionDto = {
        transaction_id: result.TransactionID,
        conversation_id: result.ConversationID,
        originator_conversation_id: result.OriginatorConversationID,
        result_type: result.ResultType,
        result_code: result.ResultCode,
        result_desc: result.ResultDesc,
        transaction_amount: undefined,
        receiver_party_public_name: undefined,
        transaction_completed_at: undefined,
        raw_result: result,
      };

      const params = result?.ResultParameters?.ResultParameter || [];
      const paramMap: Record<string, any> = {};
      for (const p of params) {
        if (!p.Key) continue;
        if (typeof p.Value === 'number') {
          p.Value = p.Value.toString();
        }
        paramMap[p.Key] = p.Value;
      }

      if (paramMap['TransactionAmount']) {
        dto.transaction_amount = Number(paramMap['TransactionAmount']);
        dto.receiver_party_public_name = paramMap['ReceiverPartyPublicName'];
        dto.transaction_completed_at =
          paramMap['TransactionCompletedDateTime'] || new Date().toISOString();
      } else if (paramMap['Amount']) {
        dto.transaction_amount = Number(paramMap['Amount']);
        dto.receiver_party_public_name = paramMap['ReceiverPartyPublicName'];
        dto.transaction_completed_at =
          this.parseMpesaDate(paramMap['TransCompletedTime'])?.toISOString() ||
          new Date().toISOString();
      }

      const existing =
        await this.b2cMpesaTransactionRepository.findByTransactionId(
          result.TransactionID,
        );

      if (existing) {
        console.log(`Duplicate callback ignored: ${result.TransactionID}`);
        return { ResultCode: 0, ResultDesc: 'Accepted' };
      }

      await this.b2cMpesaTransactionRepository.createTransaction(dto);

      // Update disbursement status
      if (result.ResultCode === 0) {
        await this.schoolDisbursementRepository.updateStatus(
          result.OriginatorConversationID,
          'completed',
          result.TransactionID,
        );
      } else {
        await this.schoolDisbursementRepository.updateStatus(
          result.OriginatorConversationID,
          'failed',
          result.TransactionID,
        );
      }

      console.log(`Transaction saved successfully: ${result.TransactionID}`);

      return { ResultCode: 0, ResultDesc: 'Accepted' };
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }
  }

  // -------------------------------
  // DISBURSE FUNDS (B2C)
  // -------------------------------
  private async disburseFunds(
    transactionId: string,
    phoneNumber: string,
    amount: number,
  ) {
    const B2C_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const B2C_CONSUMER_SECRET_KEY = process.env.MPESA_SECRET_KEY;
    const BULK_SHORTCODE = process.env.MPESA_C2B_PAYBILL;
    const B2C_INITIATOR_NAME = process.env.B2C_INITIATOR_NAME;
    const B2C_INITIATOR_PASSWORD = process.env.B2C_INITIATOR_PASSWORD;

    if (!B2C_CONSUMER_KEY || !B2C_CONSUMER_SECRET_KEY)
      throw new Error('Missing M-Pesa credentials');

    const accessToken = await this.getAccessToken(
      B2C_CONSUMER_KEY,
      B2C_CONSUMER_SECRET_KEY,
    );
    const securityCredential = await this.generateSecurityCredentials(
      B2C_INITIATOR_PASSWORD,
    );

    const requestData = {
      InitiatorName: B2C_INITIATOR_NAME,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: BULK_SHORTCODE,
      PartyB: parseInt(phoneNumber),
      Remarks: 'School disbursement',
      QueueTimeOutURL: `https://zidallie-backend.onrender.com/api/v1/subscriptions/b2c-timeout`,
      ResultURL: `https://zidallie-backend.onrender.com/api/v1/subscriptions/b2c-result`,
      Occassion: 'Disbursement',
      OriginatorConversationID: transactionId,
    };

    const url = `${this.MPESA_BASEURL}/mpesa/b2c/v3/paymentrequest`;

    try {
      const response = await axios.post(url, requestData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('B2C error:', error.response?.data || error.message);
      throw new Error('Failed to disburse funds');
    }
  }

  // -------------------------------
  // DISBURSE BANK FUNDS (B2B)
  // -------------------------------
  private async disbursebankFunds(
    transactionId: string,
    bankPaybill: string,
    accountNumber: string,
    amount: number,
  ) {
    const B2C_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const B2C_CONSUMER_SECRET_KEY = process.env.MPESA_SECRET_KEY;
    const BULK_SHORTCODE = process.env.MPESA_C2B_PAYBILL;
    const B2C_INITIATOR_NAME = process.env.B2C_INITIATOR_NAME;
    const B2C_INITIATOR_PASSWORD = process.env.B2C_INITIATOR_PASSWORD;

    if (!B2C_CONSUMER_KEY || !B2C_CONSUMER_SECRET_KEY)
      throw new Error('Missing M-Pesa credentials');

    const accessToken = await this.getAccessToken(
      B2C_CONSUMER_KEY,
      B2C_CONSUMER_SECRET_KEY,
    );
    const securityCredential = await this.generateSecurityCredentials(
      B2C_INITIATOR_PASSWORD,
    );

    const requestData = {
      Initiator: B2C_INITIATOR_NAME,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayBill',
      SenderIdentifierType: '4',
      RecieverIdentifierType: '4',
      Amount: amount,
      PartyA: BULK_SHORTCODE,
      PartyB: bankPaybill,
      AccountReference: accountNumber,
      Remarks: 'School disbursement',
      QueueTimeOutURL: `https://zidallie-backend.onrender.com/api/v1/subscriptions/b2c-result`,
      ResultURL: `https://zidallie-backend.onrender.com/api/v1/subscriptions/b2c-result`,
    };

    const url = `${this.MPESA_BASEURL}/mpesa/b2b/v1/paymentrequest`;

    try {
      const response = await axios.post(url, requestData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('B2B error:', error.response?.data || error.message);
      throw new Error('Failed to disburse funds');
    }
  }

  // -------------------------------
  // HELPER FUNCTIONS
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
      console.error(
        'Access token error:',
        error.response?.data || error.message,
      );
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

  private generateSecurityCredentials(password) {
    try {
      const certPath = 'assets/certs/ProductionCertificate.cer';
      const cert = fs.readFileSync(certPath, 'utf8');
      const encryptedBuffer = crypto.publicEncrypt(
        {
          key: cert,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(password),
      );
      return encryptedBuffer.toString('base64');
    } catch (error) {
      console.error('Error generating security credentials:', error);
      throw error;
    }
  }

  private parseMpesaDate(
    dateValue: string | number | null | undefined,
  ): Date | null {
    if (!dateValue) return null;

    const dateString = String(dateValue).trim();

    // B2B style: 20251107161221
    if (/^\d{14}$/.test(dateString)) {
      const year = dateString.slice(0, 4);
      const month = dateString.slice(4, 6);
      const day = dateString.slice(6, 8);
      const hour = dateString.slice(8, 10);
      const minute = dateString.slice(10, 12);
      const second = dateString.slice(12, 14);
      const parsed = new Date(
        `${year}-${month}-${day}T${hour}:${minute}:${second}`,
      );
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    // B2C style: "19.12.2019 11:45:50"
    if (/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(dateString)) {
      const [day, month, rest] = dateString.split('.');
      const [year, time] = rest.trim().split(' ');
      const parsed = new Date(`${year}-${month}-${day}T${time}`);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Fallback
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
