import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from 'src/common/entities/enum/notifications.enum';

export class ResponseDeviceDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  user_id!: string;

  @Expose()
  @ApiProperty({ description: 'FCM device token (last 4 chars shown)' })
  token!: string;

  @Expose()
  @ApiProperty({ enum: DevicePlatform })
  platform!: DevicePlatform;

  @Expose()
  @ApiProperty()
  active!: boolean;

  @Expose()
  @ApiProperty()
  created_at!: Date;
}
