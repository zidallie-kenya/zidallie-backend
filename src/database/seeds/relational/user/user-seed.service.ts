import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run() {
    const adminCount = await this.repository.count({
      where: {
        role: { id: RoleEnum.admin },
      },
    });

    if (adminCount === 0) {
      const password = await bcrypt.hash('secret', 10);

      await this.repository.save(
        this.repository.create({
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@example.com',
          password,
          kind: 'Driver',
          phone_number: '+254712345678',
          role: { id: RoleEnum.admin },
          status: { id: StatusEnum.active },
        }),
      );
    }

    const userCount = await this.repository.count({
      where: {
        role: { id: RoleEnum.user },
      },
    });

    if (userCount === 0) {
      const password = await bcrypt.hash('secret', 10);

      await this.repository.save(
        this.repository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password,
          kind: 'Parent',
          phone_number: '+254799999999',
          role: { id: RoleEnum.user },
          status: { id: StatusEnum.active },
        }),
      );
    }
  }
}
