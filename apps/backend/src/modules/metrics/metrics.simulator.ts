import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import {
  MetricSnapshot,
  generateNextMetric,
  generateInitialMetric,
} from './metrics.generator';
import { ServerStatus } from '@prisma/client';

@Injectable()
export class MetricsSimulator {
  private readonly logger = new Logger(MetricsSimulator.name);
  private readonly lastSnapshots = new Map<string, MetricSnapshot>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async tick(): Promise<void> {
    this.logger.debug('Metrics simulation tick started');

    const servers = await this.prisma.server.findMany({
      where: { status: ServerStatus.RUNNING },
      select: { id: true, name: true },
    });

    if (servers.length === 0) {
      this.logger.debug('No RUNNING servers found, skipping tick');
      return;
    }

    await Promise.all(servers.map((server) => this.processServer(server.id, server.name)));

    this.logger.debug(`Tick completed for ${servers.length} server(s)`);
  }

  private async processServer(serverId: string, serverName: string): Promise<void> {
    try {
      const previous = await this.getOrInitSnapshot(serverId);
      const next = generateNextMetric(previous);

      const saved = await this.prisma.metric.create({
        data: {
          server_id: serverId,
          cpu_percent: next.cpu_percent,
          ram_percent: next.ram_percent,
          disk_percent: next.disk_percent,
          network_in_kbps: next.network_in_kbps,
          network_out_kbps: next.network_out_kbps,
        },
      });

      this.lastSnapshots.set(serverId, next);

      await this.alertsService.evaluate({
        server_id: serverId,
        cpu_percent: saved.cpu_percent,
        ram_percent: saved.ram_percent,
        disk_percent: saved.disk_percent,
        network_in_kbps: saved.network_in_kbps,
        network_out_kbps: saved.network_out_kbps,
      });
    } catch (err) {
      this.logger.error(
        `Failed to process server ${serverName} (${serverId}): ${(err as Error).message}`,
      );
    }
  }

  private async getOrInitSnapshot(serverId: string): Promise<MetricSnapshot> {
    const cached = this.lastSnapshots.get(serverId);
    if (cached) return cached;

    const last = await this.prisma.metric.findFirst({
      where: { server_id: serverId },
      orderBy: { recorded_at: 'desc' },
    });

    if (last) {
      const snapshot: MetricSnapshot = {
        cpu_percent: last.cpu_percent,
        ram_percent: last.ram_percent,
        disk_percent: last.disk_percent,
        network_in_kbps: last.network_in_kbps,
        network_out_kbps: last.network_out_kbps,
      };
      this.lastSnapshots.set(serverId, snapshot);
      return snapshot;
    }

    const initial = generateInitialMetric();
    this.lastSnapshots.set(serverId, initial);
    return initial;
  }
}
