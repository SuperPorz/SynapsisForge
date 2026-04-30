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

@Module({
  imports: [
    // Database primario (PostgreSQL)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'qwerty',
      database: 'pg_database',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Impostare su false quando si va in produzione
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
  ],
  controllers: [AppController],
  providers: [AppService, HealthService],
})
export class AppModule {}
