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

/**
 * MetricsSimulator
 *
 * Tâche planifiée (@Cron toutes les 30 secondes) qui :
 *   1. Charge tous les serveurs actifs (status RUNNING) non terminés
 *   2. Pour chaque serveur, génère un nouveau snapshot (variation douce)
 *   3. Enregistre la mesure en base via PrismaService
 *   4. Appelle alertsService.evaluate() pour déclencher les alertes si besoin
 *
 * Le dernier snapshot connu par serveur est mis en cache mémoire pour garantir
 * la continuité des courbes entre deux ticks (variation douce).
 */
@Injectable()
export class MetricsSimulator {
  private readonly logger = new Logger(MetricsSimulator.name);

  /**
   * Cache mémoire : server_id → dernier snapshot généré.
   * Initialisé au premier tick depuis la base si une mesure existe,
   * sinon depuis generateInitialMetric().
   */
  private readonly lastSnapshots = new Map<string, MetricSnapshot>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  // ─── Tâche planifiée ─────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_30_SECONDS)
  async tick(): Promise<void> {
    this.logger.debug('Metrics simulation tick started');

    // Charge tous les serveurs RUNNING (excluant TERMINATED)
    const servers = await this.prisma.server.findMany({
      where: { status: ServerStatus.RUNNING },
      select: { id: true, name: true },
    });

    if (servers.length === 0) {
      this.logger.debug('No RUNNING servers found, skipping tick');
      return;
    }

    // Traite chaque serveur indépendamment
    await Promise.all(
      servers.map(server => this.processServer(server.id, server.name)),
    );

    this.logger.debug(`Tick completed for ${servers.length} server(s)`);
  }

  // ─── Traitement par serveur ───────────────────────────────────────────────────

  /**
   * Génère et persiste une mesure pour un serveur donné,
   * puis évalue les règles d'alerte.
   */
  private async processServer(serverId: string, serverName: string): Promise<void> {
    try {
      // Récupère ou initialise le snapshot précédent
      const previous = await this.getOrInitSnapshot(serverId);

      // Génère le prochain snapshot (variation douce + pic éventuel)
      const next = generateNextMetric(previous);

      // Persiste en base (champs alignés sur schema.prisma : Metric)
      const saved = await this.prisma.metric.create({
        data: {
          server_id:        serverId,
          cpu_percent:      next.cpu_percent,
          ram_percent:      next.ram_percent,
          disk_percent:     next.disk_percent,
          network_in_kbps:  next.network_in_kbps,
          network_out_kbps: next.network_out_kbps,
          // recorded_at → @default(now()) géré par Prisma
        },
      });

      // Met à jour le cache
      this.lastSnapshots.set(serverId, next);

      // Évalue les AlertRules actives pour ce serveur
      await this.alertsService.evaluate({
        server_id:        serverId,
        cpu_percent:      saved.cpu_percent,
        ram_percent:      saved.ram_percent,
        disk_percent:     saved.disk_percent,
        network_in_kbps:  saved.network_in_kbps,
        network_out_kbps: saved.network_out_kbps,
      });
    } catch (err) {
      // On log l'erreur mais on ne fait pas planter tout le tick
      this.logger.error(
        `Failed to process server ${serverName} (${serverId}): ${(err as Error).message}`,
      );
    }
  }

  // ─── Cache / initialisation ───────────────────────────────────────────────────

  /**
   * Retourne le dernier snapshot connu pour ce serveur :
   *  - Depuis le cache mémoire si disponible
   *  - Depuis la dernière mesure en base sinon
   *  - Depuis generateInitialMetric() si aucune mesure n'existe encore
   */
  private async getOrInitSnapshot(serverId: string): Promise<MetricSnapshot> {
    // 1. Cache mémoire
    const cached = this.lastSnapshots.get(serverId);
    if (cached) return cached;

    // 2. Dernière mesure en base
    const last = await this.prisma.metric.findFirst({
      where: { server_id: serverId },
      orderBy: { recorded_at: 'desc' },
    });

    if (last) {
      const snapshot: MetricSnapshot = {
        cpu_percent:      last.cpu_percent,
        ram_percent:      last.ram_percent,
        disk_percent:     last.disk_percent,
        network_in_kbps:  last.network_in_kbps,
        network_out_kbps: last.network_out_kbps,
      };
      this.lastSnapshots.set(serverId, snapshot);
      return snapshot;
    }

    // 3. Initialisation aléatoire (premier tick pour ce serveur)
    const initial = generateInitialMetric();
    this.lastSnapshots.set(serverId, initial);
    return initial;
  }
}
