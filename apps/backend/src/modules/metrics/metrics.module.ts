import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsSimulator } from './metrics.simulator';
import { AlertsModule } from '../alerts/alerts.module';

/**
 * MetricsModule
 *
 * Importe AlertsModule pour que MetricsSimulator puisse injecter AlertsService
 * et appeler alertsService.evaluate() après chaque mesure.
 *
 * PrismaModule est global → PrismaService disponible sans import explicite.
 * ScheduleModule est enregistré dans AppModule → les décorateurs @Cron
 * fonctionnent sans le réimporter ici.
 */
@Module({
  imports: [AlertsModule],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsSimulator],
  exports: [MetricsService],
})
export class MetricsModule {}
