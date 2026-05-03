// prettier-ignore
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseUuidPipe implements PipeTransform {
  //
  private readonly uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: unknown): string {
    if (typeof value !== 'string' || !this.uuidV4Regex.test(value)) {
      throw new BadRequestException(
        `Validation failed (UUID v4 expected):` + JSON.stringify(value),
      );
    }
    return value;
  }
}
