import {
  HttpException,
  HttpStatus,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockResponse = { status: mockStatus };
  const mockRequest = { url: '/test' };

  const createMockHost = (exception: unknown) =>
    ({
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new HttpExceptionFilter();
  });

  it('should format a NotFoundException correctly', () => {
    const exception = new NotFoundException('Course not found');

    filter.catch(exception, createMockHost(exception));

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: 'Course not found',
      path: '/test',
    });
  });

  it('should format a BadRequestException with array message', () => {
    const exception = new HttpException(
      { message: ['title is required', 'price must be positive'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, createMockHost(exception));

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: ['title is required', 'price must be positive'],
      path: '/test',
    });
  });

  it('should format an unknown error as InternalServerError', () => {
    const exception = new Error('Something broke');

    filter.catch(exception, createMockHost(exception));

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      path: '/test',
    });
  });

  it('should convert TypeORM unique violation to ConflictException', () => {
    const driverError = { code: '23505' };
    const pgError = new QueryFailedError('INSERT INTO ...', [], driverError);

    filter.catch(pgError, createMockHost(pgError));

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: 'Resource already exists',
      path: '/test',
    });
  });

  it('should convert non-unique TypeORM error to generic database error', () => {
    const driverError = { code: '42601' };
    const pgError = new QueryFailedError('SELECT ...', [], driverError);

    filter.catch(pgError, createMockHost(pgError));

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Database error',
      path: '/test',
    });
  });

  it('should handle a ConflictException with string message', () => {
    const exception = new ConflictException('Email already in use');

    filter.catch(exception, createMockHost(exception));

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: 'Email already in use',
      path: '/test',
    });
  });
});
