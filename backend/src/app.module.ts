import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthService } from './modules/health/health.service';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { LessonsModule } from './modules/lessons/lessons.module';
import { UploadModule } from './modules/upload/upload.module';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import { CacheModule } from './modules/cache/cache.module';
import { RedisThrottlerStorage } from './modules/cache/redis-throttler-storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: 100,
          },
        ],
        storage: new RedisThrottlerStorage(
          configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        ),
      }),
      inject: [ConfigService],
    }),
    // Database primario (PostgreSQL)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // TODO: Impostare su false quando si va in produzione
    }),
    // Database secondario (MongoDB)
    MongooseModule.forRootAsync({
      connectionName: 'mongo_synapsis',
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        user: configService.get<string>('MONGO_USER'),
        pass: configService.get<string>('MONGO_PASS'),
        authSource: configService.get<string>('MONGO_AUTH_SOURCE', 'admin'),
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({
      // Configurazioni opzionali di event-emitter2
      wildcard: true,
      delimiter: '.',
    }),
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        stores: [
          new Keyv({
            store: new KeyvRedis(
              configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
            ),
          }),
        ],
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    ReviewsModule,
    AuthModule,
    CertificatesModule,
    AdminModule,
    LessonsModule,
    UploadModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HealthService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Applica il ThrottlerGuard a livello globale,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 1° — autentica e popola req.user
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 2° — legge req.user e controlla il ruolo
    },
  ],
})
export class AppModule {}
