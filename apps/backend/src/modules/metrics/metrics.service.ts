import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';
import { AvailabilityDto } from './dto/availability.dto';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertServerExists(serverId: string): Promise<void> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true },
    });
    if (!server) throw new NotFoundException(`Server with id ${serverId} not found`);
  }

  async getHistory(serverId: string, query: QueryMetricsDto) {
    await this.assertServerExists(serverId);

    const { from, to, limit = 100 } = query;

    const data = await this.prisma.metric.findMany({
      where: {
        server_id: serverId,
        ...(from || to
          ? {
              recorded_at: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { recorded_at: 'desc' },
      take: limit,
    });

    return { data, total: data.length };
  }

  async getLatest(serverId: string) {
    await this.assertServerExists(serverId);

    const metric = await this.prisma.metric.findFirst({
      where: { server_id: serverId },
      orderBy: { recorded_at: 'desc' },
    });

    if (!metric) {
      throw new NotFoundException(
        `No metrics found for server ${serverId}. The simulator may not have run yet.`,
      );
    }

    return metric;
  }

  async getAvailability(serverId: string, query: AvailabilityDto) {
    await this.assertServerExists(serverId);

    const { from, to } = query;

    const metrics = await this.prisma.metric.findMany({
      where: {
        server_id: serverId,
        ...(from || to
          ? {
              recorded_at: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      select: { cpu_percent: true, recorded_at: true },
      orderBy: { recorded_at: 'asc' },
    });

    if (metrics.length === 0) {
      return {
        server_id: serverId,
        availability_pct: 100,
        total_points: 0,
        up_points: 0,
        down_points: 0,
        period: { from: from ?? null, to: to ?? null },
      };
    }

    const UP_THRESHOLD = 95;
    const upPoints = metrics.filter((m) => m.cpu_percent < UP_THRESHOLD).length;
    const downPoints = metrics.length - upPoints;
    const availabilityPct = (upPoints / metrics.length) * 100;

    return {
      server_id: serverId,
      availability_pct: Math.round(availabilityPct * 100) / 100,
      total_points: metrics.length,
      up_points: upPoints,
      down_points: downPoints,
      period: {
        from: from ?? metrics[0].recorded_at,
        to: to ?? metrics[metrics.length - 1].recorded_at,
      },
    };
  }
}
