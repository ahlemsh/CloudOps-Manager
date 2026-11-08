import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { MetricsModule } from '../metrics/metrics.module';

/**
 * ServersModule
 *
 * Importe MetricsModule (qui exporte MetricsService) pour réutiliser le calcul
 * de disponibilité dans GET /servers/:id/status, sans dupliquer la règle
 * "UP si cpu_percent < 95". Aucune dépendance circulaire : MetricsModule
 * n'importe pas ServersModule.
 *
 * PrismaModule est global → PrismaService disponible sans import explicite.
 */
@Module({
  imports: [MetricsModule],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}