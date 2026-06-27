import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/loggin.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import helmet from 'helmet';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); // serve per abilitare il parse cookie nel modulo Auth

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:4200',
    credentials: true,
  });

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
              },
            }
          : false,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)), // 1° — trasforma le entità in DTO usando @Exclude e @Expose
    new LoggingInterceptor(), // 2° — logga la request in arrivo
    new TimeoutInterceptor(), // 3° — imposta il timeout
    new TransformInterceptor(), // 4° — wrappa la response finale
  );

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  app.use(
    '/uploads/seed-thumbnails',
    express.static(join(__dirname, '..', 'seed-assets', 'thumbnails')),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Rimuove le proprietà (dal payload) non presenti nei DTO
      transform: true, // Trasforma i payload in istanze dei DTO
      forbidNonWhitelisted: true, // Blocca la richiesta se ci sono proprietà extr
    }),
  );

  app.useGlobalFilters(
    new TypeOrmExceptionFilter(), // ← prima: più specifico
    new HttpExceptionFilter(), // ← dopo: cattura il resto
  );

  const config = new DocumentBuilder()
    .setTitle('SynapsisForge')
    .setDescription('Api documentation')
    .setVersion('1.0')
    .addBearerAuth()
    //.addTag('api')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
