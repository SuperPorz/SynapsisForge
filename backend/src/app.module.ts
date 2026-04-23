import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [
    UsersModule,
    CoursesModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'qwerty',
      database: 'pg_database',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Da usare con cautela in produzione
    }),
    // Database Secondario (MongoDB)
    MongooseModule.forRoot('mongodb://localhost:27017/nosql_db', {
      connectionName: 'mongo_synapsis', // Nome della connessione
    }),
  ],
  controllers: [AppController],
  providers: [AppService, HealthService],
})
export class AppModule {}
