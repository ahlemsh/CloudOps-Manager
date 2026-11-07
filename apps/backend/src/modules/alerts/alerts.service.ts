import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { AcknowledgeAlertDto } from './dto/acknowledge-alert.dto';
import { QueryAlertsDto } from './dto/query-alerts.dto';
import { AlertStatus } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Alert Rules ────────────────────────────────────────────────────────────

  async createAlertRule(dto: CreateAlertRuleDto) {
    // Verify server exists
    const server = await this.prisma.server.findUnique({
      where: { id: dto.serverId },
    });
    if (!server) {
      throw new NotFoundException(`Server with id ${dto.serverId} not found`);
    }

    return this.prisma.alertRule.create({
      data: {
        name: dto.name,
        server_id: dto.serverId,
        metric_type: dto.metricType,
        operator: dto.operator,
        threshold: dto.threshold,
        severity: dto.severity,
        is_active: dto.isActive ?? true,
      },
      include: { server: { select: { id: true, name: true } } },
    });
  }

  async findAllAlertRules(serverId?: string) {
    return this.prisma.alertRule.findMany({
      where: serverId ? { server_id: serverId } : {},
      include: {
        server: { select: { id: true, name: true } },
        _count: { select: { alerts: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOneAlertRule(id: string) {
    const rule = await this.prisma.alertRule.findUnique({
      where: { id },
      include: {
        server: { select: { id: true, name: true, provider: true, region: true } },
        alerts: {
          orderBy: { triggered_at: 'desc' },
          take: 10,
        },
      },
    });
    if (!rule) throw new NotFoundException(`Alert rule ${id} not found`);
    return rule;
  }

  async updateAlertRule(id: string, dto: UpdateAlertRuleDto) {
    await this.findOneAlertRule(id);
    return this.prisma.alertRule.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.metricType && { metric_type: dto.metricType }),
        ...(dto.operator && { operator: dto.operator }),
        ...(dto.threshold !== undefined && { threshold: dto.threshold }),
        ...(dto.severity && { severity: dto.severity }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
    });
  }

  async removeAlertRule(id: string) {
    await this.findOneAlertRule(id);
    await this.prisma.alertRule.delete({ where: { id } });
    return { message: `Alert rule ${id} deleted successfully` };
  }

  // ─── Alerts ─────────────────────────────────────────────────────────────────

  async findAllAlerts(query: QueryAlertsDto) {
    const { status, severity, serverId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(severity && { severity }),
      ...(serverId && { server_id: serverId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        include: {
          server: { select: { id: true, name: true } },
          alert_rule: { select: { id: true, name: true, metric_type: true } },
          acknowledger: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { triggered_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAlert(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        server: true,
        alert_rule: true,
        acknowledger: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    return alert;
  }

  async acknowledgeAlert(id: string, userId: string, dto: AcknowledgeAlertDto) {
    const alert = await this.findOneAlert(id);

    if (alert.status !== AlertStatus.TRIGGERED && alert.status !== AlertStatus.ESCALATED) {
      throw new ForbiddenException(
        `Alert is already ${alert.status} — only TRIGGERED or ESCALATED alerts can be acknowledged`,
      );
    }

    return this.prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      },
      include: {
        server: { select: { id: true, name: true } },
        acknowledger: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async resolveAlert(id: string) {
    const alert = await this.findOneAlert(id);

    if (alert.status !== AlertStatus.ACKNOWLEDGED) {
      throw new ForbiddenException(`Alert must be ACKNOWLEDGED before it can be resolved`);
    }

    return this.prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.RESOLVED,
        resolved_at: new Date(),
      },
    });
  }

  // ─── Alert Evaluation (appelé par MetricsSimulator après chaque mesure) ──────

  /**
   * Évalue toutes les AlertRule actives d'un serveur contre les valeurs mesurées.
   * Crée une alerte si le seuil est franchi, sans dupliquer une alerte déjà ouverte
   * (statut différent de RESOLVED et CLOSED).
   *
   * @param metric - Objet contenant server_id et les 5 valeurs mesurées
   */
  async evaluate(metric: {
    server_id: string;
    cpu_percent: number;
    ram_percent: number;
    disk_percent: number;
    network_in_kbps: number;
    network_out_kbps: number;
  }): Promise<void> {
    // Charge toutes les règles actives pour ce serveur
    const rules = await this.prisma.alertRule.findMany({
      where: { server_id: metric.server_id, is_active: true },
    });

    // Mappe MetricType (enum Prisma) → valeur mesurée correspondante
    const valueMap: Record<string, number> = {
      CPU:         metric.cpu_percent,
      RAM:         metric.ram_percent,
      DISK:        metric.disk_percent,
      NETWORK_IN:  metric.network_in_kbps,
      NETWORK_OUT: metric.network_out_kbps,
    };

    for (const rule of rules) {
      const measured = valueMap[rule.metric_type];
      if (measured === undefined) continue;

      // Number() coerce Decimal (Prisma) → number natif JS
      const threshold = Number(rule.threshold);

      // Évalue l'opérateur (AlertOperator enum : GT, GTE, LT, LTE)
      const triggered =
        rule.operator === 'GT'  ? measured >  threshold :
        rule.operator === 'GTE' ? measured >= threshold :
        rule.operator === 'LT'  ? measured <  threshold :
        rule.operator === 'LTE' ? measured <= threshold :
        false;

      if (!triggered) continue;

      // Déduplication : on ne recrée pas d'alerte si une alerte non-fermée
      // (TRIGGERED, ACKNOWLEDGED, ESCALATED) existe déjà pour cette règle.
      const existing = await this.prisma.alert.findFirst({
        where: {
          alert_rule_id: rule.id,
          server_id:     metric.server_id,
          status: {
            notIn: [AlertStatus.RESOLVED, AlertStatus.CLOSED],
          },
        },
      });
      if (existing) continue;

      // Crée l'alerte avec le message auto-descriptif
      await this.prisma.alert.create({
        data: {
          alert_rule_id: rule.id,
          server_id:     metric.server_id,
          severity:      rule.severity,
          status:        AlertStatus.TRIGGERED,
          message: `[${rule.metric_type}] valeur ${measured.toFixed(1)} ${rule.operator} seuil ${threshold} — règle « ${rule.name} »`,
        },
      });
    }
  }
}
