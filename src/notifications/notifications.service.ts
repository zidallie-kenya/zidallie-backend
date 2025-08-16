import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterNotificationDto,
  SortNotificationDto,
} from './dto/query-notifications';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { Notification } from './domain/notification';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UsersService } from '../users/users.service';
import { User } from '../users/domain/user';
import { NotificationKind, NotificationSection } from '../utils/types/enums';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    let user: User | undefined = undefined;
    if (createNotificationDto.userId) {
      const userEntity = await this.usersService.findById(
        createNotificationDto.userId,
      );
      if (!userEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'This user does not exist',
          },
        });
      }
      user = userEntity;
    }

    if (!Object.values(NotificationKind).includes(createNotificationDto.kind)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          kind: 'invalid notification kind',
        },
      });
    }

    if (
      !Object.values(NotificationSection).includes(
        createNotificationDto.section,
      )
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          section: 'invalid notification section',
        },
      });
    }

    return this.notificationsRepository.create({
      user: user!,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      meta: createNotificationDto.meta ?? null,
      is_read: createNotificationDto.is_read ?? false,
      kind: createNotificationDto.kind,
      section: createNotificationDto.section,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterNotificationDto | null;
    sortOptions?: SortNotificationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Notification[]> {
    return this.notificationsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Notification['id']): Promise<NullableType<Notification>> {
    return this.notificationsRepository.findById(id);
  }

  findByIds(ids: Notification['id'][]): Promise<Notification[]> {
    return this.notificationsRepository.findByIds(ids);
  }

  findByUserId(userId: Notification['user']['id']): Promise<Notification[]> {
    return this.notificationsRepository.findByUserId(userId);
  }

  findUnreadByUserId(
    userId: Notification['user']['id'],
  ): Promise<Notification[]> {
    return this.notificationsRepository.findUnreadByUserId(userId);
  }

  findByUserIdAndSection(
    userId: Notification['user']['id'],
    section: string,
  ): Promise<Notification[]> {
    return this.notificationsRepository.findByUserIdAndSection(userId, section);
  }

  findByKind(kind: string): Promise<Notification[]> {
    return this.notificationsRepository.findByKind(kind);
  }

  getUnreadCountByUserId(userId: Notification['user']['id']): Promise<number> {
    return this.notificationsRepository.getUnreadCountByUserId(userId);
  }

  markAsRead(id: Notification['id']): Promise<Notification> {
    return this.notificationsRepository.markAsRead(id);
  }

  markAllAsReadByUserId(userId: Notification['user']['id']): Promise<void> {
    return this.notificationsRepository.markAllAsReadByUserId(userId);
  }

  findRecentByUserId(
    userId: Notification['user']['id'],
    limit = 10,
  ): Promise<Notification[]> {
    return this.notificationsRepository.findRecentByUserId(userId, limit);
  }

  async update(
    id: Notification['id'],
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification | null> {
    let user: User | undefined = undefined;
    if (updateNotificationDto.userId) {
      const userEntity = await this.usersService.findById(
        updateNotificationDto.userId,
      );
      if (!userEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'This user does not exist',
          },
        });
      }
      user = userEntity;
    }

    if (
      updateNotificationDto.kind &&
      !Object.values(NotificationKind).includes(updateNotificationDto.kind)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          kind: 'invalid notification kind',
        },
      });
    }

    if (
      updateNotificationDto.section &&
      !Object.values(NotificationSection).includes(
        updateNotificationDto.section,
      )
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          section: 'invalid notification section',
        },
      });
    }

    return this.notificationsRepository.update(id, {
      user,
      title: updateNotificationDto.title,
      message: updateNotificationDto.message,
      meta: updateNotificationDto.meta,
      is_read: updateNotificationDto.is_read,
      kind: updateNotificationDto.kind,
      section: updateNotificationDto.section,
    });
  }

  async remove(id: Notification['id']): Promise<void> {
    await this.notificationsRepository.remove(id);
  }
}
