// dto
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from 'src/common/entities/enum/users.enum';

export class FilterUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true') // query param arriva come stringa, va trasformato in boolean proprio nel DTO (data TRASFORMATION object)
  is_active?: boolean;
}
