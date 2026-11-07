import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  generateNextMetric,
  generateInitialMetric,
  clamp,
  softStep,
  MetricSnapshot,
} from './metrics.generator';

// ─── Mock PrismaService ───────────────────────────────────────────────────────

const mockPrisma = {
  server: {
    findUnique: jest.fn(),
  },
  metric: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SERVER_ID = 'server-uuid-aaaa';

const fakeServer = { id: SERVER_ID };

const makeMetric = (cpu: number, recorded_at: Date) => ({
  id: 'metric-uuid',
  server_id: SERVER_ID,
  cpu_percent: cpu,
  ram_percent: 50,
  disk_percent: 20,
  network_in_kbps: 300,
  network_out_kbps: 150,
  recorded_at,
});

// ─── Suite : fonctions pures du générateur ────────────────────────────────────

describe('metrics.generator — fonctions pures', () => {
  // ── clamp ──────────────────────────────────────────────────────────────────

  describe('clamp', () => {
    it('retourne la valeur si elle est dans [min, max]', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('retourne min si la valeur est inférieure', () => {
      expect(clamp(-5, 0, 100)).toBe(0);
    });

    it('retourne max si la valeur est supérieure', () => {
      expect(clamp(110, 0, 100)).toBe(100);
    });
  });

  // ── softStep ───────────────────────────────────────────────────────────────

  describe('softStep', () => {
    it('retourne toujours une valeur dans [0, max]', () => {
      // On répète 500 fois pour couvrir les cas extrêmes de Math.random()
      for (let i = 0; i < 500; i++) {
        const result = softStep(50, 8, 100);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });

    it('ne dépasse pas 0 même depuis une valeur proche de 0', () => {
      for (let i = 0; i < 200; i++) {
        const result = softStep(0, 8, 100);
        expect(result).toBeGreaterThanOrEqual(0);
      }
    });

    it('ne dépasse pas max même depuis une valeur proche de max', () => {
      for (let i = 0; i < 200; i++) {
        const result = softStep(100, 8, 100);
        expect(result).toBeLessThanOrEqual(100);
      }
    });
  });

  // ── generateInitialMetric ─────────────────────────────────────────────────

  describe('generateInitialMetric', () => {
    it('retourne des valeurs bornées entre 0 et 100 pour cpu, ram, disk', () => {
      for (let i = 0; i < 100; i++) {
        const m = generateInitialMetric();
        expect(m.cpu_percent).toBeGreaterThanOrEqual(0);
        expect(m.cpu_percent).toBeLessThanOrEqual(100);
        expect(m.ram_percent).toBeGreaterThanOrEqual(0);
        expect(m.ram_percent).toBeLessThanOrEqual(100);
        expect(m.disk_percent).toBeGreaterThanOrEqual(0);
        expect(m.disk_percent).toBeLessThanOrEqual(100);
      }
    });

    it('retourne des valeurs réseau bornées entre 0 et 10 000 kbps', () => {
      for (let i = 0; i < 100; i++) {
        const m = generateInitialMetric();
        expect(m.network_in_kbps).toBeGreaterThanOrEqual(0);
        expect(m.network_in_kbps).toBeLessThanOrEqual(10_000);
        expect(m.network_out_kbps).toBeGreaterThanOrEqual(0);
        expect(m.network_out_kbps).toBeLessThanOrEqual(10_000);
      }
    });
  });

  // ── generateNextMetric ────────────────────────────────────────────────────

  describe('generateNextMetric', () => {
    const baseline: MetricSnapshot = {
      cpu_percent: 50,
      ram_percent: 60,
      disk_percent: 30,
      network_in_kbps: 500,
      network_out_kbps: 250,
    };

    it('retourne toujours cpu_percent dans [0, 100]', () => {
      for (let i = 0; i < 500; i++) {
        const m = generateNextMetric(baseline);
        expect(m.cpu_percent).toBeGreaterThanOrEqual(0);
        expect(m.cpu_percent).toBeLessThanOrEqual(100);
      }
    });

    it('retourne toujours ram_percent dans [0, 100]', () => {
      for (let i = 0; i < 500; i++) {
        const m = generateNextMetric(baseline);
        expect(m.ram_percent).toBeGreaterThanOrEqual(0);
        expect(m.ram_percent).toBeLessThanOrEqual(100);
      }
    });

    it('retourne toujours disk_percent dans [0, 100]', () => {
      for (let i = 0; i < 500; i++) {
        const m = generateNextMetric(baseline);
        expect(m.disk_percent).toBeGreaterThanOrEqual(0);
        expect(m.disk_percent).toBeLessThanOrEqual(100);
      }
    });

    it('retourne toujours network_in_kbps dans [0, 10 000]', () => {
      for (let i = 0; i < 500; i++) {
        const m = generateNextMetric(baseline);
        expect(m.network_in_kbps).toBeGreaterThanOrEqual(0);
        expect(m.network_in_kbps).toBeLessThanOrEqual(10_000);
      }
    });

    it('retourne toujours network_out_kbps dans [0, 10 000]', () => {
      for (let i = 0; i < 500; i++) {
        const m = generateNextMetric(baseline);
        expect(m.network_out_kbps).toBeGreaterThanOrEqual(0);
        expect(m.network_out_kbps).toBeLessThanOrEqual(10_000);
      }
    });

    it('génère des pics CPU > 90 parmi 2000 ticks (probabilité ~12 %)', () => {
      // Avec SPIKE_PROBABILITY = 0.12 et 2000 ticks, on attend ~240 pics.
      // On vérifie qu'au moins 1 pic se produit (test statistique très conservateur).
      const hasPeak = Array.from({ length: 2000 }).some(() => {
        const m = generateNextMetric({ ...baseline, cpu_percent: 50 });
        return m.cpu_percent > 90;
      });
      expect(hasPeak).toBe(true);
    });
  });
});

// ─── Suite : MetricsService ───────────────────────────────────────────────────

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    jest.clearAllMocks();
  });

  // ── getHistory ─────────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('retourne { data, total } pour un serveur existant', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      const fakeMetrics = [makeMetric(60, new Date())];
      mockPrisma.metric.findMany.mockResolvedValue(fakeMetrics);

      const result = await service.getHistory(SERVER_ID, { limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('lance NotFoundException si le serveur n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);

      await expect(service.getHistory('unknown-id', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.metric.findMany).not.toHaveBeenCalled();
    });
  });

  // ── getLatest ──────────────────────────────────────────────────────────────

  describe('getLatest', () => {
    it('retourne la dernière mesure si elle existe', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      const latest = makeMetric(75, new Date());
      mockPrisma.metric.findFirst.mockResolvedValue(latest);

      const result = await service.getLatest(SERVER_ID);

      expect(result.cpu_percent).toBe(75);
    });

    it('lance NotFoundException si aucune mesure n\'existe', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      mockPrisma.metric.findFirst.mockResolvedValue(null);

      await expect(service.getLatest(SERVER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getAvailability ────────────────────────────────────────────────────────

  describe('getAvailability', () => {
    it('lance NotFoundException si le serveur n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);

      await expect(service.getAvailability('unknown-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retourne 100 % si aucune mesure n\'existe encore', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      mockPrisma.metric.findMany.mockResolvedValue([]);

      const result = await service.getAvailability(SERVER_ID, {});

      expect(result.availability_pct).toBe(100);
      expect(result.total_points).toBe(0);
    });

    it('calcule correctement la disponibilité : 3 UP sur 4 → 75 %', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      // 3 mesures UP (cpu < 95) + 1 mesure DOWN (cpu >= 95)
      mockPrisma.metric.findMany.mockResolvedValue([
        makeMetric(50, new Date('2026-11-01T00:00:00Z')),
        makeMetric(70, new Date('2026-11-01T00:00:30Z')),
        makeMetric(80, new Date('2026-11-01T00:01:00Z')),
        makeMetric(97, new Date('2026-11-01T00:01:30Z')), // DOWN
      ]);

      const result = await service.getAvailability(SERVER_ID, {});

      expect(result.availability_pct).toBe(75);
      expect(result.up_points).toBe(3);
      expect(result.down_points).toBe(1);
      expect(result.total_points).toBe(4);
    });

    it('calcule 100 % quand toutes les mesures sont UP', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      mockPrisma.metric.findMany.mockResolvedValue([
        makeMetric(30, new Date()),
        makeMetric(45, new Date()),
        makeMetric(60, new Date()),
      ]);

      const result = await service.getAvailability(SERVER_ID, {});

      expect(result.availability_pct).toBe(100);
      expect(result.down_points).toBe(0);
    });

    it('calcule 0 % quand toutes les mesures sont DOWN', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      mockPrisma.metric.findMany.mockResolvedValue([
        makeMetric(96, new Date()),
        makeMetric(99, new Date()),
        makeMetric(100, new Date()),
      ]);

      const result = await service.getAvailability(SERVER_ID, {});

      expect(result.availability_pct).toBe(0);
      expect(result.up_points).toBe(0);
    });

    it('arrondit la disponibilité à 2 décimales', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      // 2 UP sur 3 → 66.666... % → arrondi à 66.67
      mockPrisma.metric.findMany.mockResolvedValue([
        makeMetric(40, new Date()),
        makeMetric(50, new Date()),
        makeMetric(97, new Date()), // DOWN
      ]);

      const result = await service.getAvailability(SERVER_ID, {});

      expect(result.availability_pct).toBe(66.67);
    });
  });
});
