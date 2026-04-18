import { IsDate, IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer'; // <--- Importa questo

//piu avanti aggiungere altri paesi, magari da database
export enum Country {
  USA = 'USA',
  CANADA = 'CANADA',
  MEXICO = 'MEXICO',
  ITALY = 'ITALY',
  FRANCE = 'FRANCE',
  GERMANY = 'GERMANY',
  SPAIN = 'SPAIN',
  UK = 'UK',
}

export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

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
