import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Notification } from '../../domain/notification';
import {
  FilterNotificationDto,
  SortNotificationDto,
} from '../../dto/query-notifications';

export abstract class NotificationRepository {
  abstract create(
    data: Omit<Notification, 'id' | 'created_at'>,
  ): Promise<Notification>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterNotificationDto | null;
    sortOptions?: SortNotificationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Notification[]>;

  abstract findById(
    id: Notification['id'],
  ): Promise<NullableType<Notification>>;

  abstract findByIds(ids: Notification['id'][]): Promise<Notification[]>;

  abstract findByUserId(
    userId: Notification['user']['id'],
  ): Promise<Notification[]>;

  abstract findUnreadByUserId(
    userId: Notification['user']['id'],
  ): Promise<Notification[]>;

  abstract findByUserIdAndSection(
    userId: Notification['user']['id'],
    section: string,
  ): Promise<Notification[]>;

  abstract findByKind(kind: string): Promise<Notification[]>;

  abstract getUnreadCountByUserId(
    userId: Notification['user']['id'],
  ): Promise<number>;

  abstract markAsRead(id: Notification['id']): Promise<Notification>;

  abstract markAllAsReadByUserId(
    userId: Notification['user']['id'],
  ): Promise<void>;

  abstract findRecentByUserId(
    userId: Notification['user']['id'],
    limit?: number,
  ): Promise<Notification[]>;

  abstract update(
    id: Notification['id'],
    payload: DeepPartial<Notification>,
  ): Promise<Notification | null>;

  abstract remove(id: Notification['id']): Promise<void>;
}
