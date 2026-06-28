import { BadRequestException } from '@nestjs/common';
import { ParseUuidPipe } from './parse-uuid.pipe';

describe('ParseUuidPipe', () => {
  let pipe: ParseUuidPipe;

  beforeEach(() => {
    pipe = new ParseUuidPipe();
  });

  it('should accept a valid UUID v4', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    expect(pipe.transform(uuid)).toBe(uuid);
  });

  it('should accept a valid uppercase UUID v4', () => {
    const uuid = 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11';
    const result = pipe.transform(uuid);
    expect(result).toBe(uuid);
  });

  it('should throw BadRequestException for non-UUID string', () => {
    expect(() => pipe.transform('not-a-uuid')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for UUID v1 (wrong variant)', () => {
    const uuidV1 = 'a0eebc99-9c0b-1ef8-bb6d-6bb9bd380a11';
    expect(() => pipe.transform(uuidV1)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for non-string value (number)', () => {
    expect(() => pipe.transform(12345)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for null value', () => {
    expect(() => pipe.transform(null)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for undefined value', () => {
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for object value', () => {
    expect(() => pipe.transform({ id: 'test' })).toThrow(BadRequestException);
  });
});
