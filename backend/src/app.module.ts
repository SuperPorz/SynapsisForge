import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ReviewsModule } from './reviews/reviews.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // tempo in millisecondi (1 minuto)
          limit: 100, // massimo 100 richieste per IP ogni minuto
        },
      ],
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
    MongooseModule.forRoot('mongodb://localhost:27017/mongo_synapsis', {
      connectionName: 'mongo_synapsis', // Nome della connessione
    }),
    EventEmitterModule.forRoot({
      // Configurazioni opzionali di event-emitter2
      wildcard: true,
      delimiter: '.',
    }),
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    ReviewsModule,
    AuthModule,
    CertificatesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HealthService,
    { provide: 'APP_GUARD', useClass: ThrottlerGuard }, // Applica il ThrottlerGuard a livello globale,
  ],
})
export class AppModule {}
