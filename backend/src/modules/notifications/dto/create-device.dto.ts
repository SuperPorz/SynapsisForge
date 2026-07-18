import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from 'src/common/entities/enum/notifications.enum';

export class CreateDeviceDto {
  @ApiProperty({
    description: 'FCM device token',
    example: 'fcm-device-token-string',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
  })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;
}
