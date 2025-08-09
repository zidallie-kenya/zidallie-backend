import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { KYC } from './domain/kyc';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { FilesService } from '../files/files.service';
import { CreateKYCDto } from './dto/create-kyc.dto';
import { FilterKYCDto } from './dto/query-kyc.dto';
import { SortKYCDto } from './dto/sort-kyc.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { KYCRepository } from './infrastructure/persistence/kyc.repository';

@Injectable()
export class KycService {
  constructor(
    private readonly kycRepository: KYCRepository,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly filesService: FilesService, // Still injected but unused for validation
  ) {}

  async create(createKycDto: CreateKYCDto, bearerToken: string): Promise<KYC> {
    // Verify user authentication
    const authenticatedUser =
      await this.authService.verifyBearerToken(bearerToken);
    if (!authenticatedUser) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        errors: { auth: 'invalidToken' },
      });
    }

    // Ensure user exists
    const user = await this.usersService.findById(authenticatedUser.id);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { user: 'userNotExists' },
      });
    }

    // Check if KYC already exists for user
    const existingKyc = await this.kycRepository.findByUserId(user);
    if (existingKyc) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { kyc: 'kycAlreadyExists' },
      });
    }

    // Validate userId matches authenticated user
    if (createKycDto.userId !== authenticatedUser.id) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { userId: 'userIdMismatch' },
      });
    }

    // Store file paths directly without validation
    const nationalIdFront = createKycDto.national_id_front ?? null;
    const nationalIdBack = createKycDto.national_id_back ?? null;
    const passportPhoto = createKycDto.passport_photo ?? null;
    const drivingLicense = createKycDto.driving_license ?? null;
    const certificateOfGoodConduct =
      createKycDto.certificate_of_good_conduct ?? null;

    return this.kycRepository.create({
      national_id_front: nationalIdFront,
      national_id_back: nationalIdBack,
      passport_photo: passportPhoto,
      driving_license: drivingLicense,
      certificate_of_good_conduct: certificateOfGoodConduct,
      comments: createKycDto.comments ?? null,
      is_verified: createKycDto.is_verified ?? false,
      user,
    });
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    bearerToken,
  }: {
    filterOptions?: FilterKYCDto | null;
    sortOptions?: SortKYCDto[] | null;
    paginationOptions: IPaginationOptions;
    bearerToken: string;
  }): Promise<KYC[]> {
    // Verify user authentication
    const authenticatedUser =
      await this.authService.verifyBearerToken(bearerToken);
    if (!authenticatedUser) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        errors: { auth: 'invalidToken' },
      });
    }

    // Combine filterOptions with user filter
    const combinedFilterOptions: FilterKYCDto = {
      ...filterOptions,
      userId: authenticatedUser.id, // Ensure only the authenticated user's KYC records are returned
    };

    return this.kycRepository.findManyWithPagination({
      filterOptions: combinedFilterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: number, bearerToken: string): Promise<NullableType<KYC>> {
    // Verify user authentication
    const authenticatedUser =
      await this.authService.verifyBearerToken(bearerToken);
    if (!authenticatedUser) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        errors: { auth: 'invalidToken' },
      });
    }

    const kyc = await this.kycRepository.findById(id);
    if (!kyc || (kyc.user && kyc.user.id !== authenticatedUser.id)) {
      return null;
    }
    return kyc;
  }

  async update(
    id: number,
    updateKycDto: UpdateKycDto,
    bearerToken: string,
  ): Promise<KYC | null> {
    // Verify user authentication
    const authenticatedUser =
      await this.authService.verifyBearerToken(bearerToken);
    if (!authenticatedUser) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        errors: { auth: 'invalidToken' },
      });
    }

    const kyc = await this.kycRepository.findById(id);
    if (!kyc || (kyc.user && kyc.user.id !== authenticatedUser.id)) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { kyc: 'kycNotExists' },
      });
    }

    // Store file paths directly without validation
    const nationalIdFront =
      updateKycDto.national_id_front ?? kyc.national_id_front;
    const nationalIdBack =
      updateKycDto.national_id_back ?? kyc.national_id_back;
    const passportPhoto = updateKycDto.passport_photo ?? kyc.passport_photo;
    const drivingLicense = updateKycDto.driving_license ?? kyc.driving_license;
    const certificateOfGoodConduct =
      updateKycDto.certificate_of_good_conduct ??
      kyc.certificate_of_good_conduct;

    return this.kycRepository.update(id, {
      national_id_front: nationalIdFront,
      national_id_back: nationalIdBack,
      passport_photo: passportPhoto,
      driving_license: drivingLicense,
      certificate_of_good_conduct: certificateOfGoodConduct,
      comments: updateKycDto.comments ?? kyc.comments,
      is_verified: updateKycDto.is_verified ?? kyc.is_verified,
      user: kyc.user,
    });
  }

  async remove(id: number, bearerToken: string): Promise<void> {
    // Verify user authentication
    const authenticatedUser =
      await this.authService.verifyBearerToken(bearerToken);
    if (!authenticatedUser) {
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        errors: { auth: 'invalidToken' },
      });
    }
    const kyc = await this.kycRepository.findById(id);
    if (!kyc || (kyc.user && kyc.user.id !== authenticatedUser.id)) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { kyc: 'kycNotExists' },
      });
    }

    await this.kycRepository.remove(id);
  }
}
