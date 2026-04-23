import { IsDate, IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Country, UserRole } from '../../entities/enum/users.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsersDto {
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
  firstName!: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    description: 'The birth date of the user',
    example: '1990-01-01',
  })
  @IsDate()
  @Type(() => Date)
  birthDate!: Date;

  @ApiProperty({
    description: 'The country of the user',
    example: 'US',
  })
  @IsEnum(Country)
  country!: Country;

  @ApiProperty({
    description: 'The role of the user',
    example: 'student',
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
