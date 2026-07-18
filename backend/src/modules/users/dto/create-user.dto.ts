import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Country, UserRole } from '../../../common/entities/enum/users.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'SecurePassword123',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsString()
  first_name!: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  last_name!: string;

  @ApiProperty({
    description: 'The birth date of the user',
    example: '1990-01-01',
  })
  @IsDate()
  @Type(() => Date)
  birth_date!: Date;

  @ApiProperty({
    description: 'The country of the user',
    example: 'ITALY',
  })
  @IsEnum(Country)
  country!: Country;

  @ApiProperty({
    description: 'The role of the user (defaults to STUDENT)',
    example: 'STUDENT',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
