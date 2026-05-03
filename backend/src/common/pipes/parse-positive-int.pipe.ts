import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform {
  transform(value: unknown) {
    const val = parseInt(String(value), 10);
    if (isNaN(val) || val <= 0) {
      // prettier-ignore
      throw new BadRequestException('Validation failed: positive integer expected');
    }
    return val;
  }
}
