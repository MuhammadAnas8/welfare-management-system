import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';

import { ConfigModule } from '@nestjs/config';
import { AppLogger } from './common/logger/app-logger.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
@Module({
  imports: [AuthModule,ConfigModule.forRoot({ isGlobal: true }),],
  controllers: [AppController],
  providers: [AppLogger],
})
export class AppModule {}
