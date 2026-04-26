import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AppLogger } from './common/logger/app-logger.service';
@Module({
  imports: [AuthModule,ConfigModule.forRoot({ isGlobal: true }),],
  controllers: [AppController],
  providers: [AppLogger],
})
export class AppModule {}
