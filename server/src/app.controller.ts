import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get('/')
  getHello(): string {
    return "Welcome to the Welfare API!";
  }

  @Get('health')
  getHealth(): string {
    return "Health: OK";
  }

}
