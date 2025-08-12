import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UsersModule } from '../users/users.module';
import { RelationalNotificationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalNotificationPersistenceModule, UsersModule], // 👈 now will get repo
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
