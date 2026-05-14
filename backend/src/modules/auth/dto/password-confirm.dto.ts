// password-confirm.dto.ts
import { IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordConfirmDto {
  @ApiProperty({ description: 'UUID ricevuto via email' })
  @IsUUID()
  token!: string;

  @ApiProperty({ example: 'NuovaPassword123!' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
