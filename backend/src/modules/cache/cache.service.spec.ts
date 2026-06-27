import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      wrap: jest.fn(),
      reset: jest.fn(),
      store: {} as Record<string, unknown>,
    } as jest.Mocked<Cache>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should call cacheManager.get with the key', async () => {
      mockCacheManager.get.mockResolvedValue('value');
      const result = await service.get('test-key');
      expect(mockCacheManager.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('value');
    });
  });

  describe('set', () => {
    it('should call cacheManager.set with key, value, and optional ttl', async () => {
      await service.set('key', 'value', 300);
      expect(mockCacheManager.set).toHaveBeenCalledWith('key', 'value', 300);
    });

    it('should set without ttl when not provided', async () => {
      await service.set('key', 'value');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'key',
        'value',
        undefined,
      );
    });
  });

  describe('del', () => {
    it('should call cacheManager.del with the key', async () => {
      await service.del('test-key');
      expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('invalidateCourse', () => {
    it('should delete course detail, slug, and list caches', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);
      await service.invalidateCourse('course-uuid', 'my-slug');

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'sf:cache:course:course-uuid',
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'sf:cache:course:slug:my-slug',
      );
    });

    it('should skip slug deletion when slug is not provided', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);
      await service.invalidateCourse('course-uuid');

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'sf:cache:course:course-uuid',
      );
    });
  });
});
