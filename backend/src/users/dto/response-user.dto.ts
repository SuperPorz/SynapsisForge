// This file defines the DTO (Data Transfer Object) for RETRIEVING a user's profile.
// It includes all the fields that are relevant for the user's profile, including role and createdAt.
import { UserRole } from 'src/entities/enum/users.enum';

export class ResponseUserDto {
  id!: string;
  email!: string;
  first_name!: string;
  last_name!: string;
  role!: UserRole;
  createdAt!: Date;
}
