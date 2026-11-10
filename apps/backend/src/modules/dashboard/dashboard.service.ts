import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertStatus, AppStatus, ServerStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalServers,
      runningServers,
      stoppedServers,
      totalApplications,
      runningApplications,
      activeAlerts,
      criticalAlerts,
      totalProjects,
    ] = await this.prisma.$transaction([
      this.prisma.server.count(),
      this.prisma.server.count({ where: { status: ServerStatus.RUNNING } }),
      this.prisma.server.count({ where: { status: ServerStatus.STOPPED } }),
      this.prisma.application.count(),
      this.prisma.application.count({ where: { status: AppStatus.RUNNING } }),
      this.prisma.alert.count({
        where: { status: { in: [AlertStatus.TRIGGERED, AlertStatus.ESCALATED] } },
      }),
      this.prisma.alert.count({
        where: {
          status: { in: [AlertStatus.TRIGGERED, AlertStatus.ESCALATED] },
          severity: 'CRITICAL',
        },
      }),
      this.prisma.project.count(),
    ]);

    const recentAlerts = await this.prisma.alert.findMany({
      where: {
        status: { in: [AlertStatus.TRIGGERED, AlertStatus.ESCALATED, AlertStatus.ACKNOWLEDGED] },
      },
      include: {
        server: { select: { id: true, name: true } },
        alert_rule: { select: { name: true, metric_type: true } },
      },
      orderBy: { triggered_at: 'desc' },
      take: 5,
    });

    const serverStatusCounts = await this.prisma.server.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const appStatusCounts = await this.prisma.application.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return {
      servers: {
        total: totalServers,
        running: runningServers,
        stopped: stoppedServers,
        statusDistribution: serverStatusCounts.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
      },
      applications: {
        total: totalApplications,
        running: runningApplications,
        statusDistribution: appStatusCounts.map((a) => ({
          status: a.status,
          count: a._count.status,
        })),
      },
      alerts: { active: activeAlerts, critical: criticalAlerts, recent: recentAlerts },
      projects: { total: totalProjects },
      generatedAt: new Date(),
    };
  }

  async getMetrics(serverId?: string, limit = 50) {
    const where = serverId ? { server_id: serverId } : {};

    if (serverId) {
      const metrics = await this.prisma.metric.findMany({
        where,
        orderBy: { recorded_at: 'desc' },
        take: limit,
        include: { server: { select: { id: true, name: true } } },
      });
      return { data: metrics };
    }

    const servers = await this.prisma.server.findMany({
      where: { status: ServerStatus.RUNNING },
      select: { id: true, name: true, provider: true, region: true },
    });

    const latestMetrics = await Promise.all(
      servers.map(async (server) => {
        const latest = await this.prisma.metric.findFirst({
          where: { server_id: server.id },
          orderBy: { recorded_at: 'desc' },
        });
        return { server, metric: latest };
      }),
    );

    return { data: latestMetrics };
  }
}
