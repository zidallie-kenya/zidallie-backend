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
import { MyNotificationResponseDto } from './dto/response.dto';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

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

    // validate recipient
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
      receiver: createNotificationDto.receiver ?? null,
      sender: createNotificationDto.sender ?? null,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      meta: createNotificationDto.meta ?? null,
      is_read: createNotificationDto.is_read ?? false,
      kind: createNotificationDto.kind,
      section: createNotificationDto.section,
    });
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterNotificationDto | null;
    sortOptions?: SortNotificationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<MyNotificationResponseDto[]> {
    const notifications =
      await this.notificationsRepository.findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
      });

    return notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );
  }

  async findById(
    id: Notification['id'],
  ): Promise<NullableType<MyNotificationResponseDto>> {
    const notification = await this.notificationsRepository.findById(id);
    if (notification) {
      return this.formatNotificationResponse(notification);
    }
    return notification;
  }

  async findByIds(
    ids: Notification['id'][],
  ): Promise<MyNotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.findByIds(ids);
    return notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );
  }

  async findByUserId(
    userJwtPayload: JwtPayloadType,
  ): Promise<MyNotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.findByUserId(
      userJwtPayload.id,
    );
    return notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );
  }

  async findUnreadByUserId(
    userJwtPayload: JwtPayloadType,
  ): Promise<MyNotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.findUnreadByUserId(
      userJwtPayload.id,
    );
    return notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );
  }

  async findByUserIdAndSection(
    userJwtPayload: JwtPayloadType,
    section: string,
  ): Promise<MyNotificationResponseDto[]> {
    const userId = userJwtPayload.id;
    const notifications =
      await this.notificationsRepository.findByUserIdAndSection(
        userId,
        section,
      );
    return notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );
  }

  async findByKind(kind: string): Promise<MyNotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.findByKind(kind);
    return notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );
  }

  getUnreadCountByUserId(userJwtPayload: JwtPayloadType): Promise<number> {
    return this.notificationsRepository.getUnreadCountByUserId(
      userJwtPayload.id,
    );
  }

  markAsRead(id: Notification['id']): Promise<Notification> {
    return this.notificationsRepository.markAsRead(id);
  }

  markAllAsReadByUserId(userJwtPayload: JwtPayloadType): Promise<void> {
    return this.notificationsRepository.markAllAsReadByUserId(
      userJwtPayload.id,
    );
  }

  async findRecentByUserId(
    userJwtPayload: JwtPayloadType,
    limit = 10,
  ): Promise<MyNotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.findRecentByUserId(
      userJwtPayload.id,
      limit,
    );
    return notifications.map((notification) =>
      this.formatNotificationResponse(notification),
    );
  }

  async update(
    id: Notification['id'],
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification | null> {
    let user: User | undefined = undefined;

    // validate receiver
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
      receiver: updateNotificationDto.receiver,
      sender: updateNotificationDto.sender,
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

  private formatNotificationResponse(
    notification: Notification,
  ): MyNotificationResponseDto {
    return {
      id: notification.id,
      userId: {
        id: notification?.user?.id || 0,
        email: notification?.user?.email || '',
        name: notification?.user?.name || '',
      },
      sender: notification?.sender || '',
      receiver: notification?.receiver || '',
      title: notification?.title || '',
      message: notification?.message || '',
      meta: notification?.meta,
      is_read: notification?.is_read,
      kind: notification?.kind,
      section: notification?.section,
    };
  }
}
