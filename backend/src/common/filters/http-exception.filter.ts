import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
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
  private isMongooseValidationError(
    e: unknown,
  ): e is { errors: Record<string, { message: string }> } {
    return (
      typeof e === 'object' &&
      e !== null &&
      (e as Record<string, unknown>)?.name === 'ValidationError' &&
      typeof (e as Record<string, unknown>)?.errors === 'object'
    );
  }

  private isMongooseCastError(
    e: unknown,
  ): e is { path: string; value: unknown } {
    return (
      typeof e === 'object' &&
      e !== null &&
      (e as Record<string, unknown>)?.name === 'CastError'
    );
  }

  private toHttpException(exception: unknown): HttpException {
    // CASO 1: Mongoose validation error
    if (this.isMongooseValidationError(exception)) {
      const messages = Object.values(exception.errors).map(
        (e: { message: string }) => e.message,
      );
      return new BadRequestException(messages);
    }

    // CASO 1b: Mongoose CastError (invalid ObjectId, etc.)
    if (this.isMongooseCastError(exception)) {
      return new BadRequestException(
        `Invalid ${String(exception.path)}: ${String(exception.value)}`,
      );
    }

    // CASO 2: errore TypeORM — unique constraint violation
    if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as
        | { code?: string; errno?: number }
        | undefined;
      const isUniqueViolation =
        driverError?.code === '23505' || driverError?.errno === 1062;

      // Non esponiamo mai il messaggio raw del db
      return isUniqueViolation
        ? new ConflictException('Resource already exists') // l'errore sarà questo oppure quello di seguito
        : new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR); // Altro errore TypeORM (connessione, sintassi SQL, ecc.) → 500
    }

    // CASO 3: già una HttpException (NotFoundException, ForbiddenException, ecc.)
    if (exception instanceof HttpException) {
      return exception;
    }

    // CASO 4: errore sconosciuto (bug, TypeError, ecc.)
    // Log in produzione andrebbe qui — non esponiamo dettagli al client
    console.error('[UnhandledError]', exception);
    return new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
