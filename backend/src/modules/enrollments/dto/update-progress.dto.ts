// dto/update-progress.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({
    example: 'uuid-lesson-id',
    description: 'ID della lezione completata',
  })
  @IsUUID()
  lessonId!: string;
}
