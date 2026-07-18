import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserDevice } from '../../common/entities/user-device.entity';
import { NotificationLog } from '../../common/entities/notification-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserDevice, NotificationLog])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
