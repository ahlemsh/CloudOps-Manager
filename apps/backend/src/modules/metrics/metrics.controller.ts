import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';
import { AvailabilityDto } from './dto/availability.dto';

/**
 * Les routes Metrics sont en lecture seule → accessibles à tous les rôles
 * authentifiés (JwtAuthGuard global suffit, pas de @Roles nécessaire).
 *
 * Préfixe : /servers/:id/... (imbriqué sous la ressource Server)
 */
@ApiTags('Metrics')
@ApiBearerAuth('access-token')
@Controller('servers/:id')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // ─── GET /servers/:id/metrics ────────────────────────────────────────────────

  @Get('metrics')
  @ApiOperation({
    summary: 'Historique des métriques d\'un serveur',
    description:
      'Retourne les mesures CPU/RAM/DISK/NETWORK triées par date décroissante. ' +
      'Filtres optionnels : from, to (ISO 8601), limit (max 1000).',
  })
  @ApiParam({ name: 'id', description: 'UUID du serveur' })
  @ApiResponse({ status: 200, description: '{ data: Metric[], total: number }' })
  @ApiResponse({ status: 404, description: 'Serveur introuvable' })
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryMetricsDto,
  ) {
    return this.metricsService.getHistory(id, query);
  }

  // ─── GET /servers/:id/metrics/latest ────────────────────────────────────────

  @Get('metrics/latest')
  @ApiOperation({
    summary: 'Dernière mesure enregistrée pour un serveur',
    description: 'Retourne le snapshot le plus récent (recorded_at DESC).',
  })
  @ApiParam({ name: 'id', description: 'UUID du serveur' })
  @ApiResponse({ status: 200, description: 'Dernière mesure Metric' })
  @ApiResponse({ status: 404, description: 'Serveur introuvable ou aucune mesure' })
  getLatest(@Param('id', ParseUUIDPipe) id: string) {
    return this.metricsService.getLatest(id);
  }

  // ─── GET /servers/:id/availability ──────────────────────────────────────────

  @Get('availability')
  @ApiOperation({
    summary: 'Disponibilité d\'un serveur en % sur une période',
    description:
      'Un point est comptabilisé UP si cpu_percent < 95. ' +
      'Retourne availability_pct, total_points, up_points, down_points et la période analysée.',
  })
  @ApiParam({ name: 'id', description: 'UUID du serveur' })
  @ApiResponse({
    status: 200,
    description:
      '{ server_id, availability_pct, total_points, up_points, down_points, period }',
  })
  @ApiResponse({ status: 404, description: 'Serveur introuvable' })
  getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailabilityDto,
  ) {
    return this.metricsService.getAvailability(id, query);
  }
}
