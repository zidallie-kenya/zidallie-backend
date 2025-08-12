import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { NotificationMapper } from '../mappers/notification.mapper';
import { Notification } from '../../../../domain/notification';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterNotificationDto,
  SortNotificationDto,
} from '../../../../dto/query-notifications';
import { NotificationRepository } from '../../notification.repository';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

@Injectable()
export class NotificationsRelationalRepository
  implements NotificationRepository
{
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
  ) {}

  async create(data: Notification): Promise<Notification> {
    const persistenceModel = NotificationMapper.toPersistence(data);
    const newEntity = await this.notificationsRepository.save(
      this.notificationsRepository.create(persistenceModel),
    );
    return NotificationMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterNotificationDto | null;
    sortOptions?: SortNotificationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Notification[]> {
    const where: FindOptionsWhere<NotificationEntity> = {};

    if (filterOptions?.userId) {
      where.user = { id: Number(filterOptions.userId) };
    }

    if (filterOptions?.is_read !== undefined) {
      where.is_read = filterOptions.is_read;
    }

    if (filterOptions?.kind) {
      where.kind = filterOptions.kind;
    }

    if (filterOptions?.section) {
      where.section = filterOptions.section;
    }

    const entities = await this.notificationsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ) || { created_at: 'DESC' },
      relations: ['user'],
    });

    return entities.map((notification) =>
      NotificationMapper.toDomain(notification),
    );
  }

  async findById(id: Notification['id']): Promise<NullableType<Notification>> {
    const entity = await this.notificationsRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    return entity ? NotificationMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Notification['id'][]): Promise<Notification[]> {
    const entities = await this.notificationsRepository.find({
      where: { id: In(ids) },
      relations: ['user'],
    });

    return entities.map((notification) =>
      NotificationMapper.toDomain(notification),
    );
  }

  async findByUserId(userId: number): Promise<Notification[]> {
    const entities = await this.notificationsRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return entities.map((notification) =>
      NotificationMapper.toDomain(notification),
    );
  }

  async findUnreadByUserId(userId: number): Promise<Notification[]> {
    const entities = await this.notificationsRepository.find({
      where: {
        user: { id: userId },
        is_read: false,
      },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return entities.map((notification) =>
      NotificationMapper.toDomain(notification),
    );
  }

  async findByUserIdAndSection(
    userId: number,
    section: string,
  ): Promise<Notification[]> {
    const entities = await this.notificationsRepository.find({
      where: {
        user: { id: userId },
        section: section as any,
      },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return entities.map((notification) =>
      NotificationMapper.toDomain(notification),
    );
  }

  async findByKind(kind: string): Promise<Notification[]> {
    const entities = await this.notificationsRepository.find({
      where: { kind: kind as any },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return entities.map((notification) =>
      NotificationMapper.toDomain(notification),
    );
  }

  async getUnreadCountByUserId(userId: number): Promise<number> {
    return await this.notificationsRepository.count({
      where: {
        user: { id: userId },
        is_read: false,
      },
    });
  }

  async markAsRead(id: Notification['id']): Promise<Notification> {
    const entity = await this.notificationsRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    if (!entity) {
      throw new Error('Notification not found');
    }

    entity.is_read = true;
    const updatedEntity = await this.notificationsRepository.save(entity);

    return NotificationMapper.toDomain(updatedEntity);
  }

  async markAllAsReadByUserId(userId: number): Promise<void> {
    await this.notificationsRepository.update(
      { user: { id: userId }, is_read: false },
      { is_read: true },
    );
  }

  async findRecentByUserId(
    userId: number,
    limit = 10,
  ): Promise<Notification[]> {
    const entities = await this.notificationsRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: limit,
    });

    return entities.map((notification) =>
      NotificationMapper.toDomain(notification),
    );
  }

  async update(
    id: Notification['id'],
    payload: DeepPartial<Notification>,
  ): Promise<Notification | null> {
    const entity = await this.notificationsRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    if (!entity) {
      throw new Error('Notification not found');
    }

    const updatedEntity = await this.notificationsRepository.save(
      this.notificationsRepository.create({
        ...entity,
        ...NotificationMapper.toPersistence(payload),
      }),
    );

    return NotificationMapper.toDomain(updatedEntity);
  }

  async remove(id: Notification['id']): Promise<void> {
    const entity = await this.notificationsRepository.findOne({
      where: { id: Number(id) },
    });

    if (!entity) {
      throw new Error('Notification not found');
    }

    await this.notificationsRepository.remove(entity);
  }
}
