// This file defines the DTO (Data Transfer Object) for RETRIEVING a user's profile.
// It includes all the fields that are relevant for the user's profile, including role and createdAt.
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/entities/enum/users.enum';

// @Expose() è necessario quando si usa plainToInstance con excludeExtraneousValues.
// Senza di esso, class-transformer non sa quali campi includere nella trasformazione.
export class ResponseUserDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty()
  first_name!: string;

  @Expose()
  @ApiProperty()
  last_name!: string;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @Expose()
  @ApiProperty()
  createdAt!: Date;
}
