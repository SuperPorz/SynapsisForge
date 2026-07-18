import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { UserDevice } from '../../common/entities/user-device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ResponseDeviceDto } from './dto/response-device.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(UserDevice)
    private readonly deviceRepo: Repository<UserDevice>,
  ) {}

  async registerDevice(
    userId: string,
    dto: CreateDeviceDto,
  ): Promise<ResponseDeviceDto> {
    const existing = await this.deviceRepo.findOne({
      where: { user_id: userId, platform: dto.platform },
    });

    if (existing) {
      existing.token = dto.token;
      existing.active = true;
      await this.deviceRepo.save(existing);
      return plainToInstance(ResponseDeviceDto, existing, {
        excludeExtraneousValues: true,
      });
    }

    const device = this.deviceRepo.create({
      user_id: userId,
      token: dto.token,
      platform: dto.platform,
    });
    await this.deviceRepo.save(device);
    return plainToInstance(ResponseDeviceDto, device, {
      excludeExtraneousValues: true,
    });
  }

  async removeDevice(deviceId: string, userId: string): Promise<void> {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, user_id: userId },
    });
    if (!device) {
      throw new NotFoundException('Device token not found');
    }
    await this.deviceRepo.remove(device);
  }

  async listDevices(userId: string): Promise<ResponseDeviceDto[]> {
    const devices = await this.deviceRepo.find({
      where: { user_id: userId, active: true },
      order: { created_at: 'DESC' },
    });
    return devices.map((device) =>
      plainToInstance(ResponseDeviceDto, device, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
