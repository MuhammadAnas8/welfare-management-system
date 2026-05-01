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
  @Get('users')
  getUsers() {
    return [{ id: 1, name: 'Ali'  }, { id: 2, name: 'Veli' }, { id: 3, name: 'Ayşe' }];
  }
}
