import { ConsoleLogger, Injectable } from '@nestjs/common';
import { config } from '../config/app.config';
@Injectable()
export class AppLogger extends ConsoleLogger {
  logRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    if (config.app.isDev || durationMs > 1000) {
      this.log(`${method} ${path} ${statusCode} +${durationMs}ms`, 'HTTP');
    }
  }
}