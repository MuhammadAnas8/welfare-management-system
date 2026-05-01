import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from '@nestjs/config';
import { AppLogger } from './common/logger/app-logger.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 60 }]
    })
  ],
  controllers: [AppController],
  providers: [AppLogger],
})
export class AppModule {}
