import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service.js';
import { config } from '../config/app.config.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    const normalizedMessage = this.extractMessage(exceptionResponse);

    const method = request.method;
    const path = request.originalUrl ?? request.url;

    // Hide internal errors in production
    const clientMessage =
      status >= 500 && config.app.isProd
        ? 'Internal server error'
        : normalizedMessage;

    //  Log full details (always)
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `${method} ${path} -> ${status} ${normalizedMessage}`,
      stack,
      'ExceptionFilter',
    );

    // 📦 Standard response
    response.status(status).json({
      success: false,
      statusCode: status,
      message: clientMessage,
      path,
      timestamp: new Date().toISOString(),

      // Only expose debug info in development
      ...(config.app.logLevel === 'debug' && {
        debug:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : exception,
      }),
    });
  }

  private extractMessage(exceptionResponse: unknown): string {
    if (!exceptionResponse) return 'Internal server error';

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object') {
      const res = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(res.message)) {
        return res.message.join(', ');
      }

      if (typeof res.message === 'string') {
        return res.message;
      }

      if (typeof res.error === 'string') {
        return res.error;
      }
    }

    return 'Internal server error';
  }
}
