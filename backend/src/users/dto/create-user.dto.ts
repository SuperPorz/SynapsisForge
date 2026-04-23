import { IsDate, IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Country, UserRole } from '../../entities/enum/users.enum';

export class CreateUsersDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsDate()
  @Type(() => Date)
  birthDate!: Date;

  @IsEnum(Country)
  country!: Country;

  @IsEnum(UserRole)
  role!: UserRole;
}
