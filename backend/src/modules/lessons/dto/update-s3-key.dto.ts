import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateS3KeyDto {
  @ApiProperty({ example: 'videos/550e8400-e29b-41d4-a716-446655440000.mp4' })
  @IsString()
  @IsNotEmpty()
  s3Key!: string;
}
