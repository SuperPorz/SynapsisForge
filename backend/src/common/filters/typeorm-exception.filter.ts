import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Response } from 'express';

/**
 * Codici di errore PostgreSQL rilevanti.
 * Riferimento completo: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_CODES: Record<string, { status: number; message: string }> = {
  '23505': {
    status: HttpStatus.CONFLICT,
    message: 'Risorsa già esistente (vincolo di unicità violato)',
  },
  '23503': {
    status: HttpStatus.CONFLICT,
    message: 'Operazione non consentita: risorsa correlata non trovata',
  },
  '23502': {
    status: HttpStatus.BAD_REQUEST,
    message: 'Campo obbligatorio mancante',
  },
  '22P02': {
    status: HttpStatus.BAD_REQUEST,
    message: 'Formato input non valido',
  },
  '42703': {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Colonna non trovata nel database',
  },
};

/**
 * Filtra QueryFailedError lanciati da TypeORM e li traduce in risposte HTTP.
 */
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Il codice errore PG è su `driverError.code` (non tipizzato da TypeORM)
    const pgCode = (
      exception as QueryFailedError & { driverError?: { code?: string } }
    ).driverError?.code;

    const mapped = pgCode ? PG_ERROR_CODES[pgCode] : undefined;

    const status = mapped?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = mapped?.message ?? 'Errore interno del database';

    // Logga sempre l'errore originale per debug — mai esporlo al client
    this.logger.error(
      `QueryFailedError [PG ${pgCode ?? 'unknown'}]: ${exception.message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
