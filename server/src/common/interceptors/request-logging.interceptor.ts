import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLogger } from '../logger/app-logger.service.js';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<{ method: string; originalUrl?: string; url: string }>();
    const res = httpContext.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        this.logger.logRequest(req.method, req.originalUrl ?? req.url, res.statusCode, durationMs);
      }),
    );
  }
}
