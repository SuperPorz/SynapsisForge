import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { LoggingInterceptor } from './interceptors/loggin.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(
    new LoggingInterceptor(), // 1° — logga la request in arrivo
    new TimeoutInterceptor(), // 2° — imposta il timeout
    new TransformInterceptor(), // 3° — wrappa la response finale
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Rimuove le proprietà (dal payload) non presenti nei DTO
      transform: true, // Trasforma i payload in istanze dei DTO
      forbidNonWhitelisted: true, // Blocca la richiesta se ci sono proprietà extr
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SynapsisForge')
    .setDescription('Api documentation')
    .setVersion('1.0')
    .addTag('api')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
