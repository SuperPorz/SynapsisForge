import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { HealthService } from '../src/modules/health/health.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/loggin.interceptor';
import { TimeoutInterceptor } from '../src/common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

// ---------------------------------------------------------------------------
// Health è il test più semplice: nessuna dipendenza da DB o repository.
// Verifica che l'app si avvii correttamente e che la risposta rispetti
// il formato atteso (wrappato da TransformInterceptor).
// ---------------------------------------------------------------------------

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // HealthService è registrato in AppModule senza un modulo dedicato.
    // AppController espone la rotta /health e richiede anche AppService nel costruttore.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, HealthService],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new LoggingInterceptor(),
      new TimeoutInterceptor(),
      new TransformInterceptor(),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // GET /health
  // ---------------------------------------------------------------------------

  describe('GET /health', () => {
    it('dovrebbe rispondere 200', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
    });

    it('dovrebbe restituire status OK e un timestamp ISO valido', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);

      // TransformInterceptor wrappa sempre la risposta in { data, statusCode, timestamp }
      expect(res.body.data.status).toBe('OK');
      expect(new Date(res.body.data.timestamp).toISOString()).toBe(
        res.body.data.timestamp,
      );
    });
  });
});
