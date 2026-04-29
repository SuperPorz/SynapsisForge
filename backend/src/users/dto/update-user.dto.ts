// This file defines the DTO (Data Transfer Object) for updating a user's profile.
// It includes only the fields that are allowed to be updated by the user,
// excluding sensitive fields like role and id to prevent unauthorized changes.

export class UpdateUserDto {
  email!: string;
  first_name!: string;
  last_name!: string;
} // the role can be updated via another safe endpoint, so we don't include it here to prevent accidental updates
