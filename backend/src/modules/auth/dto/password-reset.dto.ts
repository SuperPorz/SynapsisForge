// password-reset.dto.ts
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetDto {
  @ApiProperty({ example: 'mario@example.com' })
  @IsEmail()
  email!: string;
}
