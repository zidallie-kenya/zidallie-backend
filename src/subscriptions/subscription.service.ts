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
import { StudentPaymentEntity } from './infrastructure/persistence/relational/entities/student_payment.entity';
import { SchoolDisbursementEntity } from './infrastructure/persistence/relational/entities/school_disbursement.entity';
import { SubscriptionEntity } from './infrastructure/persistence/relational/entities/subscription.entity';
import { subscriptionLogger as logger } from './subscription.logger';

interface DisbursementData {
  school: any;
  disbursementRecord: SchoolDisbursementEntity;
  amount: number;
}

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

      console.log(`Initiating school payment for student: ${student.id}`);
      console.log(`Amount: ${dto.amount}, Phone Number: ${dto.phone_number}`);

      return this.handleSchoolPayment(
        student,
        dto.phone_number,
        dto.amount,
        school,
      );
    } else if (
      student.service_type === 'carpool' ||
      student.service_type === 'private'
    ) {
      return this.handleCarpoolPrivatePayment(
        student,
        dto.phone_number,
        dto.amount,
      );
    } else {
      throw new BadRequestException('Invalid service type');
    }
  }

  // -------------------------------
  // SCHOOL PAYMENT HANDLER
  // -------------------------------
  private async handleSchoolPayment(student, phoneNumber, amount, school) {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const secretKey = process.env.MPESA_SECRET_KEY;
    if (!consumerKey || !secretKey) {
      logger.error('Missing M-Pesa credentials');
      throw new Error('Missing M-Pesa credentials');
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
      TransactionDesc: 'STUDENT SUBSCRIPTION',
    };

    console.log('Initiating M-Pesa STK Push for student:', student.id);

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

      console.log(
        `${school.name} has commision: ${school.has_commission ? 'has commission' : 'no commission'}`,
      );

      if (!school.has_commission) {
        // Daily/Weekly/Monthly payment model
        console.log('school has no commission');

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
        console.log('school has commission');

        // Check if subscription has expired or is still valid for current term
        const currentDate = new Date();
        const expiryDate = new Date(activeSubscription.expiry_date);

        const hasExpired = expiryDate <= currentDate;

        const hasFullyPaidCurrentTerm =
          activeSubscription.term_total_paid >= student.transport_term_fee;

        if (!hasExpired && hasFullyPaidCurrentTerm) {
          throw new BadRequestException(
            `Student has already paid full amount for the current term. Payment is valid until ${expiryDate.toLocaleDateString()}`,
          );
        }

        // Determine payment type based on term_total_paid (current term payments only)
        // If term expired and they're paying again, it's a new initial payment
        const paymentType =
          hasExpired || activeSubscription.term_total_paid === 0
            ? 'initial'
            : 'installment';

        pending = await this.pendingPaymentsRepository.createPendingPayment({
          studentId: student.id,
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
      logger.error(`M-Pesa STK Push Error for student ${student.id}`);
      console.error(
        'MPESA STK Push Error:',
        error.response?.data || error.message,
      );

      // Re-throw BadRequestException as is
      if (error instanceof BadRequestException) {
        throw error;
      }

      logger.error(
        `Failed to initiate payment for student ${student.id}: ${error.message}`,
      );
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

    if (!consumerKey || !secretKey) {
      logger.error('Missing M-Pesa credentials');
      throw new Error('Missing M-Pesa credentials');
    }

    const subscription =
      await this.subscriptionsRepository.findActiveByStudentId(student.id);

    if (!subscription) {
      console.log('subcription not found');
      logger.error(`No active subscription found for student: ${student.id}`);
      throw new BadRequestException(
        'No active subscription found for the student',
      );
    }

    const currentDate = new Date();
    const expiryDate = new Date(subscription.expiry_date);
    const hasExpired = expiryDate <= currentDate;
    const hasFullyPaidCurrentTerm =
      subscription.term_total_paid >= student.transport_term_fee;

    if (!hasExpired && hasFullyPaidCurrentTerm) {
      logger.error(
        `Student ${student.id} has already paid full amount for the current term. Payment is valid until ${expiryDate.toLocaleDateString()}`,
      );
      throw new BadRequestException(
        `Student has already paid full amount for the current term. Payment is valid until ${expiryDate.toLocaleDateString()}`,
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
      logger.error(
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

    console.log(
      `Amount received: ${amount} from phone number: ${phoneNumber} for CheckoutRequestID: ${checkoutRequestID}`,
    );

    let disbursementData: DisbursementData | null = null;

    try {
      // ✅ START TRANSACTION AT THE VERY BEGINNING
      await this.dataSource.transaction(async (manager) => {
        console.log(
          `🔒 Transaction started and locked for: ${checkoutRequestID}`,
        );
        logger.info(
          `🔒 Transaction started and locked for: ${checkoutRequestID}`,
        );

        // 1. ACQUIRE A PESSIMISTIC LOCK ON PENDING PAYMENT
        const pending_payment = await manager
          .getRepository(PendingPaymentEntity)
          .findOne({
            where: { checkoutId: checkoutRequestID },
            lock: { mode: 'pessimistic_write' },
          });

        // 2. RE-CHECK IF IT STILL EXISTS
        if (!pending_payment) {
          console.log(
            `⚠️ Transaction ${checkoutRequestID} already processed or pending record removed.`,
          );
          logger.error(
            `Transaction ${checkoutRequestID} already processed or pending record removed.`,
          );
          return;
        }

        // 3. DOUBLE CHECK StudentPayment table (Safety net)
        const existingPayment = await manager
          .getRepository(StudentPaymentEntity)
          .findOne({
            where: { transaction_id: checkoutRequestID },
          });

        if (existingPayment) {
          console.log(
            `⚠️ Duplicate detected in StudentPayment: ${checkoutRequestID}`,
          );
          logger.info(
            `⚠️ Duplicate detected in StudentPayment: ${checkoutRequestID}`,
          );
          // Remove the pending payment since it was already processed
          await manager.remove(PendingPaymentEntity, pending_payment);
          return;
        }

        const student = await this.studentsService.findById(
          pending_payment.studentId,
        );

        if (!student) {
          console.log(
            `❌ Student not found for pending payment: ${pending_payment.id}`,
          );
          logger.error(
            `Student not found for pending payment: ${pending_payment.id}`,
          );
          return;
        }

        // 4. PROCESS BUSINESS LOGIC INSIDE THE TRANSACTION
        if (!student.school) {
          // Carpool/Private - no disbursement needed
          await this.processCarpoolPrivatePaymentInTransaction(
            manager,
            pending_payment,
            checkoutRequestID,
            phoneNumber,
            amount,
            student,
          );
        } else {
          const school = await this.schoolsService.findById(student.school.id);

          if (!school) {
            console.log(`❌ School not found for student: ${student.id}`);
            logger.error(`School not found for student: ${student.id}`);
            return;
          }

          logger.info(
            `Processing payment for school: ${school.name} (ID: ${school.id})`,
          );

          if (!school.has_commission) {
            logger.info(
              `Processing daily payment for student ${student.id} at school ${school.name} with no commission`,
            );

            // Daily payment model
            const result = await this.processSchoolBusDailyPaymentInTransaction(
              manager,
              pending_payment,
              checkoutRequestID,
              phoneNumber,
              amount,
              student,
              school,
            );

            // Store disbursement data to execute AFTER transaction commits
            if (
              result.shouldDisburse &&
              result.disbursementRecord !== undefined
            ) {
              disbursementData = {
                school,
                disbursementRecord: result.disbursementRecord,
                amount: result.amountToDisburse!,
              };
            }
          } else {
            // Term payment model
            const result = await this.processSchoolBusTermPaymentInTransaction(
              manager,
              pending_payment,
              checkoutRequestID,
              phoneNumber,
              amount,
              student,
              school,
            );

            // Store disbursement data to execute AFTER transaction commits
            if (result.shouldDisburse && result.disbursementRecord) {
              disbursementData = {
                school,
                disbursementRecord: result.disbursementRecord,
                amount: result.amountToDisburse!,
              };
            }
          }
        }

        logger.info(
          `✅ Transaction committed successfully for: ${checkoutRequestID}`,
        );

        console.log(
          `✅ Transaction committed successfully for: ${checkoutRequestID}`,
        );
      });

      // ✅ DISBURSEMENT HAPPENS OUTSIDE TRANSACTION
      if (disbursementData !== null) {
        console.log(`💰 Initiating disbursement outside transaction...`);
        logger.info(`Initiating disbursement outside transaction...`);

        const data = disbursementData as DisbursementData;

        await this.disburseToSchool(
          data.school,
          data.disbursementRecord,
          data.amount,
        );
        logger.info(
          `✅ Disbursement completed for: ${data.disbursementRecord.id} to school ${data.school.name} amount: ${data.amount} `,
        );
        console.log(`✅ Disbursement completed`);
      }
    } catch (error) {
      console.error(
        `Error handling callback for ${checkoutRequestID}:`,
        error.message,
      );
      logger.error(
        `Error handling callback for ${checkoutRequestID}: ${error.message}`,
      );
    }
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  // -------------------------------
  // PROCESS SCHOOL BUS - DAILY PAYMENT
  // -------------------------------
  private async processSchoolBusDailyPaymentInTransaction(
    manager: any,
    pending_payment,
    transactionId: string,
    phoneNumber: string,
    amount: number,
    student,
    school,
  ): Promise<{
    shouldDisburse: boolean;
    disbursementRecord?: SchoolDisbursementEntity;
    amountToDisburse?: number;
  }> {
    try {
      console.log('Reached processSchoolBusDailyPayment');
      console.log('Amount received:(school bus daily payment):', amount);

      // Log student and school info for better traceability
      logger.info(
        'Processing school bus daily payment for student: ' + student.id,
      );
      logger.info('Amount received:(school bus daily payment): ' + amount);

      const amt = Number(amount);
      const dailyFee = Number(student.daily_fee);

      if (isNaN(amt) || isNaN(dailyFee) || dailyFee <= 0) {
        console.error('Invalid amount or daily fee:', { amt, dailyFee });
        logger.error('Invalid amount or daily fee:', { amt, dailyFee });
        return { shouldDisburse: false };
      }

      const daysPaidFor = Math.floor(amt / dailyFee);

      // just for logging purposes
      if (amt % dailyFee !== 0) {
        const student_info = `Student ID: ${student.id}, Name: ${student.name}`;
        console.log('Amount does not cover full days:', {
          amt,
          dailyFee,
          student_info,
        });
        console.log(
          `amount remaining that does not cover full day: ${amt % dailyFee}`,
        );

        logger.warn('Amount does not cover full days:', {
          amt,
          dailyFee,
          student_info,
        });
        logger.warn(
          `amount remaining that does not cover full day: ${amt % dailyFee}`,
        );
      }

      if (daysPaidFor <= 0) {
        console.error('Amount too small to cover any days:', { amt, dailyFee });
        logger.error('Amount too small to cover any days:', { amt, dailyFee });
        return { shouldDisburse: false };
      }

      console.log('Recording student payment');
      logger.info('Recording student payment for daily subscription');

      const studentPayment = await this.studentPaymentRepository.create(
        manager,
        {
          student,
          termId: null,
          transaction_id: transactionId,
          phone_number: phoneNumber,
          amount_paid: amt,
          payment_type: pending_payment.paymentType || 'daily',
        },
      );

      console.log('Student payment recorded');
      logger.info(`Student payment recorded with ID: ${studentPayment.id}`);

      console.log(
        'Fetching active subscription entity for student',
        student.id,
      );
      logger.info(
        'Fetching active subscription entity for student: ' + student.id,
      );

      const subscriptionEntity = await manager
        .getRepository(SubscriptionEntity)
        .findOne({
          where: { student: { id: student.id } },
          lock: { mode: 'pessimistic_write' },
        });

      if (!subscriptionEntity) {
        console.error('No active subscription found for student', student.id);
        logger.error('No active subscription found for student: ' + student.id);
        return { shouldDisburse: false };
      }

      console.log('Subscription entity found', subscriptionEntity.id);
      logger.info(
        `Subscription entity found with ID: ${subscriptionEntity.id} for student: ${student.id}`,
      );

      const currentDate = new Date();
      let startDate = currentDate;
      if (
        subscriptionEntity.expiry_date &&
        subscriptionEntity.expiry_date > currentDate
      ) {
        startDate = subscriptionEntity.expiry_date;
      }

      console.log('Start date for new access:', startDate);
      logger.info(
        `Start date for new access: ${startDate.toISOString()} for student: ${student.id}`,
      );

      const expiryDate = this.calculateExpiryDateExcludingWeekends(
        startDate,
        daysPaidFor,
      );

      console.log('Calculated expiry date:', expiryDate);
      logger.info(
        `Calculated expiry date: ${expiryDate.toISOString()} for student: ${student.id}`,
      );

      subscriptionEntity.total_paid += amt;
      subscriptionEntity.term_total_paid += amt;
      subscriptionEntity.expiry_date = expiryDate;
      subscriptionEntity.last_payment_date = new Date();
      subscriptionEntity.status = 'active';
      subscriptionEntity.days_access = daysPaidFor;

      console.log('Saving subscription entity');
      logger.info('Saving subscription entity for student: ' + student.id);

      await manager.save(subscriptionEntity);
      console.log('Subscription entity saved');
      logger.info(
        `Subscription entity updated with new expiry date: ${subscriptionEntity.expiry_date.toISOString()} for student: ${student.id}`,
      );

      // ✅ CREATE DISBURSEMENT RECORD INSIDE TRANSACTION
      console.log('Creating disbursement record inside transaction');
      logger.info(
        'Creating disbursement record inside transaction for school: ' +
          school.name,
      );

      const disbursementRecord = manager.create(SchoolDisbursementEntity, {
        student,
        term: null,
        payment: studentPayment,
        bank_paybill: school.bank_paybill_number || null,
        account_number: school.bank_account_number || null,
        amount_disbursed: amt,
        disbursement_type: school.disbursement_phone_number ? 'B2C' : 'B2B',
        transaction_id: null, // Will be updated after API call
        status: 'pending',
      });

      await manager.save(disbursementRecord);
      console.log('Disbursement record created:', disbursementRecord.id);
      logger.info(
        `Disbursement record created with ID: ${disbursementRecord.id} for student: ${student.id}`,
      );

      console.log('Removing pending payment', pending_payment.id);
      logger.info(
        `Removing pending payment with ID: ${pending_payment.id} for student: ${student.id}`,
      );

      await manager.remove(PendingPaymentEntity, pending_payment);
      console.log('Pending payment removed');
      logger.info(
        `Pending payment with ID: ${pending_payment.id} removed for student: ${student.id}`,
      );

      console.log(`Daily payment processed successfully: ${transactionId}`);
      logger.info(
        `Daily payment processed successfully with Transaction ID: ${transactionId} for student: ${student.id}`,
      );
      return {
        shouldDisburse: true,
        disbursementRecord,
        amountToDisburse: amt,
      };
    } catch (error) {
      console.error('Error processing daily payment:', error);
      logger.error('Error processing daily payment: ' + error.message);
      return { shouldDisburse: false };
    }
  }

  // -------------------------------
  // PROCESS SCHOOL BUS - TERM PAYMENT
  // -------------------------------
  private async processSchoolBusTermPaymentInTransaction(
    manager: any,
    pending_payment,
    transactionId: string,
    phoneNumber: string,
    amount: number,
    student,
    school,
  ): Promise<{
    shouldDisburse: boolean;
    disbursementRecord?: SchoolDisbursementEntity;
    amountToDisburse?: number;
  }> {
    try {
      console.log('📍 Processing term payment (in transaction)');
      logger.info(
        'Processing term payment for student: ' +
          student.id +
          ' at school: ' +
          school.name,
      );

      console.log('Amount received:(school bus term payment):', amount);
      logger.info('Amount received:(school bus term payment): ' + amount);

      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        console.error('Invalid payment amount:', amt);
        logger.error('Invalid payment amount: ' + amt);
        return { shouldDisburse: false };
      }

      let amountToDisburse = 0;

      console.log('Transaction started for term payment');
      logger.info(
        'Transaction started for term payment with Transaction ID: ' +
          transactionId,
      );

      // Fetch the active subscription entity
      console.log(
        'Fetching active subscription entity for student',
        student.id,
      );

      logger.info(
        'Fetching active subscription entity for student: ' + student.id,
      );

      // ✅ CORRECT - Use manager and lock
      const subscriptionEntity = await manager
        .getRepository(SubscriptionEntity)
        .findOne({
          where: { student: { id: student.id } },
          lock: { mode: 'pessimistic_write' },
        });

      if (!subscriptionEntity) {
        console.error('No active subscription found for student', student.id);
        logger.error('No active subscription found for student: ' + student.id);
        return { shouldDisburse: false };
      }

      console.log('Subscription entity found', subscriptionEntity.id);
      logger.info(
        `Subscription entity found with ID: ${subscriptionEntity.id} for student: ${student.id}`,
      );

      const currentDate = new Date();
      const expiryDate = new Date(subscriptionEntity.expiry_date);
      const hasExpired = expiryDate <= currentDate;

      // If subscription expired, reset for new term cycle
      if (hasExpired) {
        console.log('Subscription expired, resetting term_total_paid');
        logger.info(
          'Subscription expired, resetting term_total_paid for student: ' +
            student.id,
        );
        subscriptionEntity.term_total_paid = 0;
        subscriptionEntity.balance = student.transport_term_fee;
        subscriptionEntity.is_commission_paid = false;
        subscriptionEntity.commission_paid_amount = 0;
      }

      // Record student payment
      console.log('Recording student payment for term');
      logger.info('Recording student payment for term subscription');
      const studentPayment = await this.studentPaymentRepository.create(
        manager,
        {
          student,
          termId: null,
          transaction_id: transactionId,
          phone_number: phoneNumber,
          amount_paid: amt,
          payment_type: pending_payment.paymentType || 'initial',
        },
      );
      console.log('Student payment recorded:', studentPayment.id);
      logger.info(
        `Student payment recorded with ID: ${studentPayment.id} for student: ${student.id}`,
      );

      // Calculate amount to disburse to school
      amountToDisburse = amt;

      if (!subscriptionEntity.is_commission_paid) {
        const remainingCommission =
          school.commission_amount - subscriptionEntity.commission_paid_amount;

        console.log(`Remaining commission to collect: ${remainingCommission}`);
        logger.info(
          `Remaining commission to collect: ${remainingCommission} for student: ${student.id}`,
        );

        if (amt >= remainingCommission) {
          // This payment covers the remaining commission
          amountToDisburse = amt - remainingCommission;
          subscriptionEntity.commission_paid_amount += remainingCommission;
          subscriptionEntity.is_commission_paid = true;

          console.log(
            `Commission fully paid. Remaining commission (${remainingCommission}) deducted. ` +
              `Disbursing ${amountToDisburse} to school.`,
          );

          logger.info(
            `Commission fully paid for student: ${student.id}. Remaining commission (${remainingCommission}) deducted. ` +
              `Disbursing ${amountToDisburse} to school ${school.name}.`,
          );
        } else {
          // Payment is less than remaining commission
          subscriptionEntity.commission_paid_amount += amt;
          amountToDisburse = 0;

          console.log(
            `Partial commission payment of ${amt}. ` +
              `Total commission paid so far: ${subscriptionEntity.commission_paid_amount}/${school.commission_amount}. ` +
              `No disbursement to school yet.`,
          );
          logger.info(
            `Partial commission payment of ${amt} for student: ${student.id}. ` +
              `Total commission paid so far: ${subscriptionEntity.commission_paid_amount}/${school.commission_amount}. ` +
              `No disbursement to school ${school.name} yet.`,
          );
        }
      } else {
        // Commission already fully paid, all goes to school
        amountToDisburse = amt;
        console.log('Commission already paid, full amount goes to school');
        logger.info(
          'Commission already paid for student: ' +
            student.id +
            ', full amount goes to school ' +
            school.name,
        );
      }

      subscriptionEntity.total_paid += amt;
      subscriptionEntity.term_total_paid += amt;
      subscriptionEntity.balance =
        student.transport_term_fee - subscriptionEntity.term_total_paid;
      subscriptionEntity.last_payment_date = new Date();

      // Calculate expiry date - 95 days (approximately one term)
      if (subscriptionEntity.balance <= 0) {
        subscriptionEntity.status = 'fully_paid';
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 95);
        subscriptionEntity.expiry_date = newExpiryDate;
        console.log('Full payment received, expiry set to:', newExpiryDate);
        logger.info(
          'Full payment received for student: ' +
            student.id +
            ', expiry set to: ' +
            newExpiryDate.toISOString(),
        );
      } else {
        subscriptionEntity.status = 'partially_paid';
        const amount_per_day = Math.floor(
          subscriptionEntity.transport_term_fee / 95,
        );
        const days_access = Math.floor(Number(amount) / amount_per_day);
        const date = new Date();
        date.setDate(date.getDate() + days_access);
        subscriptionEntity.expiry_date = date;

        console.log(
          `Partial payment received, balance: ${subscriptionEntity.balance}`,
        );
        logger.info(
          `Partial payment received for student: ${student.id}, balance: ${subscriptionEntity.balance}`,
        );
      }

      console.log('Saving subscription entity');
      logger.info('Saving subscription entity for student: ' + student.id);
      await manager.save(subscriptionEntity);
      console.log('Subscription entity saved');
      logger.info(
        `Subscription entity updated for student: ${student.id}, new balance: ${subscriptionEntity.balance}`,
      );

      // ✅ CREATE DISBURSEMENT RECORD INSIDE TRANSACTION (only if amount > 0)
      let disbursementRecord: SchoolDisbursementEntity | undefined = undefined;
      if (amountToDisburse > 0) {
        console.log('Creating disbursement record inside transaction');
        logger.info(
          'Creating disbursement record inside transaction for school: ' +
            school.name,
        );

        disbursementRecord = manager.create(SchoolDisbursementEntity, {
          student,
          term: null,
          payment: studentPayment,
          bank_paybill: school.bank_paybill_number || null,
          account_number: school.bank_account_number || null,
          amount_disbursed: amountToDisburse,
          disbursement_type: school.disbursement_phone_number ? 'B2C' : 'B2B',
          transaction_id: null, // Will be updated after API call
          status: 'pending',
        });

        await manager.save(disbursementRecord);
        console.log('Disbursement record created:', disbursementRecord?.id);
        logger.info(
          `Disbursement record created with ID: ${disbursementRecord?.id} for student: ${student.id}`,
        );
      }

      // Remove pending payment using transaction manager
      console.log('Removing pending payment', pending_payment.id);
      logger.info(
        'Removing pending payment for transaction ID: ' + transactionId,
      );

      await manager.remove(PendingPaymentEntity, pending_payment);
      console.log('Pending payment removed');
      logger.info(
        `Pending payment with ID: ${pending_payment.id} removed for student: ${student.id}`,
      );

      console.log(`✅ Term payment processed successfully: ${transactionId}`);
      logger.info(
        `Term payment processed successfully with Transaction ID: ${transactionId} for student: ${student.id}`,
      );

      return {
        shouldDisburse: amountToDisburse > 0,
        disbursementRecord,
        amountToDisburse,
      };
    } catch (error) {
      console.error('Error processing term payment:', error);
      logger.error('Error processing term payment: ' + error.message);
      return { shouldDisburse: false };
    }
  }

  // -------------------------------
  // PROCESS CARPOOL/PRIVATE PAYMENT
  // -------------------------------
  private async processCarpoolPrivatePaymentInTransaction(
    manager: any,
    pending_payment,
    transactionId: string,
    phoneNumber: string,
    amount: number,
    student,
  ): Promise<void> {
    try {
      console.log('Reached processCarpoolPrivatePayment');
      logger.info(
        'Processing carpool/private payment for student: ' + student.id,
      );

      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        console.error('Invalid payment amount:', amt);
        logger.error('Invalid payment amount: ' + amt);
        return;
      }

      console.log('Transaction started for carpool/private payment');
      logger.info(
        'Transaction started for carpool/private payment with Transaction ID: ' +
          transactionId,
      );

      console.log(
        'Fetching active subscription entity for student',
        student.id,
      );
      logger.info(
        'Fetching active subscription entity for student: ' + student.id,
      );

      // ✅ CORRECT - Use manager and lock
      const subscriptionEntity = await manager
        .getRepository(SubscriptionEntity)
        .findOne({
          where: { student: { id: student.id } },
          lock: { mode: 'pessimistic_write' },
        });

      if (!subscriptionEntity) {
        console.error('No active subscription found for student', student.id);
        logger.error('No active subscription found for student: ' + student.id);
        return;
      }

      const currentDate = new Date();
      const expiryDate = new Date(subscriptionEntity.expiry_date);
      const hasExpired = expiryDate <= currentDate;

      // If subscription expired, reset for new term cycle
      if (hasExpired) {
        console.log('Subscription expired, resetting for new term cycle');
        logger.info(
          'Subscription expired for student: ' +
            student.id +
            ', resetting for new term cycle',
        );
        subscriptionEntity.term_total_paid = 0;
        subscriptionEntity.balance = student.transport_term_fee;
      }

      // Record student payment
      console.log('Recording student payment for carpool/private');
      logger.info('Recording student payment for carpool/private subscription');
      await this.studentPaymentRepository.create(manager, {
        student,
        termId: null,
        transaction_id: transactionId,
        phone_number: phoneNumber,
        amount_paid: amt,
        payment_type: pending_payment.paymentType || 'installment',
      });
      console.log('Student payment recorded');
      logger.info(
        `Student payment recorded for carpool/private subscription with Transaction ID: ${transactionId} for student: ${student.id}`,
      );

      // Update subscription details
      subscriptionEntity.total_paid += amt;
      subscriptionEntity.term_total_paid += amt;
      subscriptionEntity.balance = Math.max(
        student.transport_term_fee - subscriptionEntity.term_total_paid,
        0,
      );
      subscriptionEntity.last_payment_date = new Date();

      if (subscriptionEntity.balance <= 0) {
        subscriptionEntity.status = 'fully_paid';
      } else {
        subscriptionEntity.status = 'partially_paid';
      }

      // Today + 95 days
      expiryDate.setDate(expiryDate.getDate() + 95);
      subscriptionEntity.expiry_date = expiryDate;

      console.log('Saving subscription entity');
      logger.info('Saving subscription entity for student: ' + student.id);
      await manager.save(subscriptionEntity);

      console.log('Subscription entity saved');
      logger.info(
        `Subscription entity updated for student: ${student.id}, new balance: ${subscriptionEntity.balance}, new expiry: ${subscriptionEntity.expiry_date.toISOString()}`,
      );

      // Remove pending payment
      console.log('Removing pending payment', pending_payment.id);
      logger.info(
        'Removing pending payment for transaction ID: ' + transactionId,
      );
      await manager.remove(PendingPaymentEntity, pending_payment);

      console.log('Pending payment removed');
      logger.info(
        `Pending payment with ID: ${pending_payment.id} removed for student: ${student.id}`,
      );

      console.log(
        `Carpool/Private payment processed successfully: ${transactionId}`,
      );
      logger.info(
        `Carpool/Private payment processed successfully with Transaction ID: ${transactionId} for student: ${student.id}`,
      );
    } catch (error) {
      console.error(
        `Error processing carpool/private payment for studentId ${student.id}:`,
        error,
      );
      logger.error(
        `Error processing carpool/private payment for studentId ${student.id}: ${error.message}`,
      );
    }
  }

  // -------------------------------
  // DISBURSE TO SCHOOL
  // -------------------------------
  private async disburseToSchool(
    school,
    disbursementRecord: SchoolDisbursementEntity,
    amount: number,
  ) {
    try {
      console.log(
        `Initiating disbursement for record ID: ${disbursementRecord.id}`,
      );
      logger.info(
        `Initiating disbursement for record ID: ${disbursementRecord.id} to school: ${school.name} amount: ${amount}`,
      );

      if (school.disbursement_phone_number) {
        // B2C to phone
        console.log('Calling B2C API...');
        logger.info(
          `Calling B2C API for school: ${school.name} to phone number: ${school.disbursement_phone_number}`,
        );
        const response = await this.disburseFunds(
          disbursementRecord.payment.transaction_id,
          school.disbursement_phone_number,
          amount,
        );

        // ✅ UPDATE existing record
        await this.schoolDisbursementRepository.update(disbursementRecord.id, {
          transaction_id: response.ConversationID,
        });

        console.log(`B2C disbursement initiated to: ${school.name}`);
        logger.info(
          `B2C disbursement initiated to: ${school.name} with phone number: ${school.disbursement_phone_number}`,
        );
      } else if (school.bank_account_number && school.bank_paybill_number) {
        // B2B to bank
        console.log('Calling B2B API...');
        logger.info(
          `Calling B2B API for school: ${school.name} to bank account: ${school.bank_account_number}, paybill: ${school.bank_paybill_number}`,
        );
        const response = await this.disbursebankFunds(
          disbursementRecord.payment.transaction_id,
          school.bank_paybill_number,
          school.bank_account_number,
          amount,
        );

        // ✅ UPDATE existing record
        await this.schoolDisbursementRepository.update(disbursementRecord.id, {
          transaction_id: response.ConversationID,
        });

        console.log(`B2B disbursement initiated to: ${school.name}`);
        logger.info(
          `B2B disbursement initiated to: ${school.name} with bank account: ${school.bank_account_number}, paybill: ${school.bank_paybill_number}`,
        );
      } else {
        console.warn(`No valid disbursement method for school: ${school.name}`);
        logger.warn(
          `No valid disbursement method for school: ${school.name}. Disbursement record ID: ${disbursementRecord.id} cannot be processed.`,
        );

        // Mark as failed if no disbursement method
        await this.schoolDisbursementRepository.update(disbursementRecord.id, {
          status: 'failed',
        });
      }
    } catch (error) {
      console.error('Error disbursing funds:', error);
      logger.error('Error disbursing funds: ' + error.message);

      // ✅ Mark disbursement as failed
      try {
        await this.schoolDisbursementRepository.update(disbursementRecord.id, {
          status: 'failed',
        });
      } catch (updateError) {
        console.error('Error updating disbursement status:', updateError);
        logger.error(
          'Error updating disbursement status: ' + updateError.message,
        );
      }
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
    logger.info(
      'Received M-Pesa B2C/B2B callback with data: ' +
        JSON.stringify(receivedData),
    );

    try {
      if (!receivedData?.Result) {
        console.warn('Invalid M-Pesa callback payload:', receivedData);
        logger.warn(
          'Invalid M-Pesa callback payload: ' + JSON.stringify(receivedData),
        );
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

      // Ensure params is always an array
      let params = result?.ResultParameters?.ResultParameter || [];
      if (!Array.isArray(params)) {
        params = [params];
      }

      const paramMap: Record<string, any> = {};
      for (const p of params) {
        if (!p?.Key) continue;
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
        logger.warn(
          `Duplicate M-Pesa callback ignored for Transaction ID: ${result.TransactionID}`,
        );
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
      logger.info(
        `M-Pesa transaction saved successfully with Transaction ID: ${result.TransactionID}, Result Code: ${result.ResultCode}`,
      );

      return { ResultCode: 0, ResultDesc: 'Accepted' };
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      logger.error('Error processing M-Pesa callback: ' + error.message);
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

    if (!B2C_CONSUMER_KEY || !B2C_CONSUMER_SECRET_KEY) {
      logger.error('Missing M-Pesa credentials for disbursement');
      throw new Error('Missing M-Pesa credentials');
    }

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
      logger.error(
        'Error during B2C disbursement: ' +
          (error.response?.data || error.message),
      );
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

    if (!B2C_CONSUMER_KEY || !B2C_CONSUMER_SECRET_KEY) {
      logger.error('Missing M-Pesa credentials for bank disbursement');
      throw new Error('Missing M-Pesa credentials');
    }

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
      logger.error(
        'Error during B2B disbursement: ' +
          (error.response?.data || error.message),
      );
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
      logger.error(
        'Error getting M-Pesa access token: ' +
          (error.response?.data || error.message),
      );
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
      logger.error('Error generating security credentials: ' + error.message);
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
