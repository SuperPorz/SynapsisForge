import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/loggin.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)), // 1° — trasforma le entità in DTO usando @Exclude e @Expose
    new LoggingInterceptor(), // 2° — logga la request in arrivo
    new TimeoutInterceptor(), // 3° — imposta il timeout
    new TransformInterceptor(), // 4° — wrappa la response finale
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Rimuove le proprietà (dal payload) non presenti nei DTO
      transform: true, // Trasforma i payload in istanze dei DTO
      forbidNonWhitelisted: true, // Blocca la richiesta se ci sono proprietà extr
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

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
