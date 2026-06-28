import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap response with data, statusCode and timestamp', (done) => {
    const mockResponse = { statusCode: 201 };
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as any;

    const mockCallHandler = {
      handle: () => of({ id: '123', name: 'Test' }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        data: { id: '123', name: 'Test' },
        statusCode: 201,
        timestamp: expect.any(String),
      });
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
      done();
    });
  });

  it('should wrap null data', (done) => {
    const mockResponse = { statusCode: 200 };
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as any;

    const mockCallHandler = {
      handle: () => of(null),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        data: null,
        statusCode: 200,
        timestamp: expect.any(String),
      });
      done();
    });
  });

  it('should wrap array data', (done) => {
    const mockResponse = { statusCode: 200 };
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as any;

    const mockCallHandler = {
      handle: () => of([1, 2, 3]),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        data: [1, 2, 3],
        statusCode: 200,
        timestamp: expect.any(String),
      });
      done();
    });
  });
});
