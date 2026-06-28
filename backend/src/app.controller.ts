import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthService } from './modules/health/health.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('/health')
  healthCheck(): object {
    return this.healthService.healthCheck();
  }
}
