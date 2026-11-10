import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsSimulator } from './metrics.simulator';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsSimulator],
  exports: [MetricsService],
})
export class MetricsModule {}
