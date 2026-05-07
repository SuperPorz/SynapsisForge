// This file defines the DTO (Data Transfer Object) for updating a user's profile.
// It includes only the fields that are allowed to be updated by the user,
// excluding sensitive fields like role,id and email to prevent unauthorized changes.

import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Country } from 'src/common/entities/enum/users.enum';

// Campi che l'utente può modificare autonomamente.
// email e role sono esclusi deliberatamente:
//   - email richiede verifica separata
//   - role viene aggiornato solo tramite endpoint amministrativi
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Mario' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Rossi' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiPropertyOptional({ enum: Country, example: Country.ITALY })
  @IsOptional()
  @IsEnum(Country)
  country?: Country;
}
