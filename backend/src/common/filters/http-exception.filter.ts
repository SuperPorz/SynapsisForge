// prettier-ignore
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, ConflictException, } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Tipo preciso per la risposta strutturata di HttpException
interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
}

// Type guard: distingue stringa da oggetto strutturato
function isHttpExceptionResponse(
  value: string | object,
): value is HttpExceptionResponse {
  return typeof value === 'object';
}

// @Catch() senza argomenti = intercetta TUTTO, non solo HttpException
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Normalizziamo prima in HttpException,
    // poi estraiamo i dati per la risposta finale
    const httpException = this.toHttpException(exception);
    const status = httpException.getStatus();
    const raw = httpException.getResponse();

    // getResponse() può tornare una stringa o un oggetto, quindi gestiamo entrambi i casi
    const message = isHttpExceptionResponse(raw)
      ? (raw.message ?? 'An error occurred')
      : raw;

    const error = isHttpExceptionResponse(raw)
      ? (raw.error ?? HttpStatus[status])
      : HttpStatus[status];

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
    });
  }

  // Metodo privato che "classifica" l'eccezione
  // e la converte sempre in HttpException
  private toHttpException(exception: unknown): HttpException {
    // CASO 1: errore TypeORM — unique constraint violation
    if (exception instanceof QueryFailedError) {
      const isUniqueViolation =
        exception.driverError?.code === '23505' ||
        exception.driverError?.errno === 1062;

      // Non esponiamo mai il messaggio raw del db
      return isUniqueViolation
        ? new ConflictException('Resource already exists') // l'errore sarà questo oppure quello di seguito
        : new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR); // Altro errore TypeORM (connessione, sintassi SQL, ecc.) → 500
    }

    // CASO 2: già una HttpException (NotFoundException, ForbiddenException, ecc.)
    if (exception instanceof HttpException) {
      return exception;
    }

    // CASO 3: errore sconosciuto (bug, TypeError, ecc.)
    // Log in produzione andrebbe qui — non esponiamo dettagli al client
    console.error('[UnhandledError]', exception);
    return new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
