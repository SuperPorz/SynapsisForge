import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisPubSubService } from './redis-pubsub.service';

@Global()
@Module({
  providers: [CacheService, RedisPubSubService],
  exports: [CacheService, RedisPubSubService],
})
export class CacheModule {}
