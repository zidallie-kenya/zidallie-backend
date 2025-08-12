import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterOnboardingDto,
  SortOnboardingDto,
} from './dto/query-onboarding.dto';
import { OnboardingRepository } from './infrastructure/persistence/onboarding.repository';
import { Onboarding } from './domain/onboarding';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { School } from '../schools/domain/schools';

@Injectable()
export class OnboardingService {
  constructor(private readonly onboardingRepository: OnboardingRepository) {}

  async create(createOnboardingDto: CreateOnboardingDto): Promise<Onboarding> {
    // Validate school exists
    let school: School | undefined = undefined;
    if (createOnboardingDto.school?.id) {
      // You might want to inject SchoolService here to validate school exists
      school = createOnboardingDto.school as School;
    }

    // Check for existing onboarding with same email
    if (createOnboardingDto.parent_email) {
      const existingByEmail = await this.onboardingRepository.findByParentEmail(
        createOnboardingDto.parent_email,
      );

      if (existingByEmail.length > 0) {
        // You might want to allow multiple onboardings per email or throw error
        // For now, allowing multiple
      }
    }

    // Check for existing onboarding with same phone
    if (createOnboardingDto.parent_phone) {
      const existingByPhone = await this.onboardingRepository.findByParentPhone(
        createOnboardingDto.parent_phone,
      );

      if (existingByPhone.length > 0) {
        // You might want to allow multiple onboardings per phone or throw error
        // For now, allowing multiple
      }
    }

    return this.onboardingRepository.create({
      parent_name: createOnboardingDto.parent_name,
      parent_email: createOnboardingDto.parent_email ?? null,
      parent_phone: createOnboardingDto.parent_phone ?? null,
      address: createOnboardingDto.address ?? null,
      student_name: createOnboardingDto.student_name,
      student_gender: createOnboardingDto.student_gender,
      school: school!,
      ride_type: createOnboardingDto.ride_type,
      pickup: createOnboardingDto.pickup ?? null,
      dropoff: createOnboardingDto.dropoff ?? null,
      start_date: createOnboardingDto.start_date ?? null,
      mid_term: createOnboardingDto.mid_term ?? null,
      end_date: createOnboardingDto.end_date ?? null,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterOnboardingDto | null;
    sortOptions?: SortOnboardingDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Onboarding[]> {
    return this.onboardingRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Onboarding['id']): Promise<NullableType<Onboarding>> {
    return this.onboardingRepository.findById(id);
  }

  findByIds(ids: Onboarding['id'][]): Promise<Onboarding[]> {
    return this.onboardingRepository.findByIds(ids);
  }

  findByParentEmail(email: string): Promise<Onboarding[]> {
    return this.onboardingRepository.findByParentEmail(email);
  }

  findByParentPhone(phone: string): Promise<Onboarding[]> {
    return this.onboardingRepository.findByParentPhone(phone);
  }

  findBySchoolId(schoolId: number): Promise<Onboarding[]> {
    return this.onboardingRepository.findBySchoolId(schoolId);
  }

  findByDateRange(startDate: Date, endDate: Date): Promise<Onboarding[]> {
    return this.onboardingRepository.findByDateRange(startDate, endDate);
  }

  async update(
    id: Onboarding['id'],
    updateOnboardingDto: UpdateOnboardingDto,
  ): Promise<Onboarding | null> {
    const existingOnboarding = await this.onboardingRepository.findById(id);

    if (!existingOnboarding) {
      throw new NotFoundException('Onboarding form not found');
    }

    // Validate school if provided
    let school: School | undefined = undefined;
    if (updateOnboardingDto.school?.id) {
      // You might want to inject SchoolService here to validate school exists
      school = updateOnboardingDto.school as School;
    }

    // Check for email conflicts if email is being updated
    if (
      updateOnboardingDto.parent_email &&
      updateOnboardingDto.parent_email !== existingOnboarding.parent_email
    ) {
      const existingByEmail = await this.onboardingRepository.findByParentEmail(
        updateOnboardingDto.parent_email,
      );

      const conflictExists = existingByEmail.some(
        (onboarding) => onboarding.id !== id,
      );
      if (conflictExists) {
        // You might want to allow this or throw error based on business logic
      }
    }

    // Check for phone conflicts if phone is being updated
    if (
      updateOnboardingDto.parent_phone &&
      updateOnboardingDto.parent_phone !== existingOnboarding.parent_phone
    ) {
      const existingByPhone = await this.onboardingRepository.findByParentPhone(
        updateOnboardingDto.parent_phone,
      );

      const conflictExists = existingByPhone.some(
        (onboarding) => onboarding.id !== id,
      );
      if (conflictExists) {
        // You might want to allow this or throw error based on business logic
      }
    }

    return this.onboardingRepository.update(id, {
      parent_name: updateOnboardingDto.parent_name,
      parent_email: updateOnboardingDto.parent_email,
      parent_phone: updateOnboardingDto.parent_phone,
      address: updateOnboardingDto.address,
      student_name: updateOnboardingDto.student_name,
      student_gender: updateOnboardingDto.student_gender,
      school: school,
      ride_type: updateOnboardingDto.ride_type,
      pickup: updateOnboardingDto.pickup,
      dropoff: updateOnboardingDto.dropoff,
      start_date: updateOnboardingDto.start_date,
      mid_term: updateOnboardingDto.mid_term,
      end_date: updateOnboardingDto.end_date,
    });
  }

  async remove(id: Onboarding['id']): Promise<void> {
    const existingOnboarding = await this.onboardingRepository.findById(id);

    if (!existingOnboarding) {
      throw new NotFoundException('Onboarding form not found');
    }

    await this.onboardingRepository.remove(id);
  }
}
