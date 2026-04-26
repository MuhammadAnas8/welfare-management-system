import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class AppLogger extends ConsoleLogger {
  logRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.log(`${method} ${path} ${statusCode} +${durationMs}ms`, 'HTTP');
  }
}
