import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import bcrypt from 'bcryptjs';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Role } from '../roles/domain/role';
import { Status } from '../statuses/domain/status';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Do not remove comment below.
    // <creating-property />

    let password: string | undefined = undefined;

    if (createUserDto.password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(createUserDto.password, salt);
    }

    let email: string | null = null;

    if (createUserDto.email) {
      const existing = await this.usersRepository.findByEmail(
        createUserDto.email,
      );

      if (existing) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'The Email already exists',
          },
        });
      }
      email = createUserDto.email;
    }

    let role: Role | undefined = undefined;

    if (createUserDto.role?.id) {
      const valid = Object.values(RoleEnum)
        .map(String)
        .includes(String(createUserDto.role.id));

      if (!valid) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'this role does not exist',
          },
        });
      }

      role = {
        id: createUserDto.role.id,
      };
    } else {
      if (createUserDto?.kind) {
        if (createUserDto?.kind === 'Driver') {
          role = { id: 3 };
        } else if (createUserDto?.kind === 'Parent') {
          role = { id: 4 };
        } else if (createUserDto?.kind === 'Admin') {
          role = { id: 1 };
        } else {
          role = { id: 2 };
        }
      }
    }

    let status: Status | undefined = undefined;

    if (createUserDto.status?.id) {
      const valid = Object.values(StatusEnum)
        .map(String)
        .includes(String(createUserDto.status.id));
      if (!valid) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            status: 'this status does not exist',
          },
        });
      }

      status = {
        id: createUserDto.status.id,
      };
    }

    return this.usersRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone_number: createUserDto.phone_number ?? null,
      push_token: createUserDto.push_token ?? null,
      kind: createUserDto.kind,
      meta: createUserDto.meta ?? null,
      wallet_balance: createUserDto.wallet_balance ?? 0,
      is_kyc_verified: createUserDto.is_kyc_verified ?? false,
      name: `${createUserDto.firstName ?? ''} ${createUserDto.lastName ?? ''}`.trim(),
      email,
      password,
      provider: createUserDto.provider ?? AuthProvidersEnum.email,
      socialId: createUserDto.socialId,
      photo: createUserDto.photo ?? null,
      school_id: createUserDto.school_id ?? null,
      role,
      status,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  async findByIdOrEmail(identifier: string): Promise<NullableType<User>> {
    const isEmail = identifier.includes('@');
    if (isEmail) {
      return this.usersRepository.findByEmail(identifier);
    }
    return this.usersRepository.findById(Number(identifier));
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    return this.usersRepository.findBySocialIdAndProvider({
      socialId,
      provider,
    });
  }

  async update(
    id: User['id'],
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    // Do not remove comment below.
    // <updating-property />

    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const user = await this.usersRepository.findById(id);

      if (user && user?.password !== updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(updateUserDto.password, salt);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const existing = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (existing && existing.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'This email already exists',
          },
        });
      }

      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let role: Role | undefined = undefined;

    if (updateUserDto.role?.id) {
      const valid = Object.values(RoleEnum)
        .map(String)
        .includes(String(updateUserDto.role.id));
      if (!valid) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'This role does not exist',
          },
        });
      }

      role = {
        id: updateUserDto.role.id,
      };
    }

    let status: Status | undefined = undefined;

    if (updateUserDto.status?.id) {
      const valid = Object.values(StatusEnum)
        .map(String)
        .includes(String(updateUserDto.status.id));
      if (!valid) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            status: 'This status does not exist',
          },
        });
      }

      status = {
        id: updateUserDto.status.id,
      };
    }

    return this.usersRepository.update(id, {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      phone_number: updateUserDto.phone_number,
      push_token: updateUserDto.push_token,
      kind: updateUserDto.kind,
      meta: updateUserDto.meta,
      wallet_balance: updateUserDto.wallet_balance,
      is_kyc_verified: updateUserDto.is_kyc_verified,
      email,
      password,
      provider: updateUserDto.provider,
      socialId: updateUserDto.socialId,
      name: `${updateUserDto.firstName ?? ''} ${updateUserDto.lastName ?? ''}`.trim(), // required
      photo: updateUserDto.photo,
      school_id: updateUserDto.school_id,
      role,
      status,
    });
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.remove(id);
  }
}
