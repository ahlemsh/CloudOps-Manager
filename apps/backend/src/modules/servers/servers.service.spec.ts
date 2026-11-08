import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServerStatus } from '@prisma/client';
import { ServersService } from './servers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  environment: { findUnique: jest.fn() },
  server: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  metric: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

const mockMetrics = {
  getAvailability: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SERVER_ID = 'server-uuid-1111';
const ENV_ID = 'env-uuid-2222';

const fakeServer = {
  id: SERVER_ID,
  name: 'prod-web-01',
  provider: 'Hetzner',
  region: 'eu-central',
  ip_address: '95.216.1.100',
  cpu_cores: 4,
  ram_gb: 8,
  storage_gb: 80,
  status: ServerStatus.RUNNING,
  environment_id: ENV_ID,
  created_at: new Date(),
  updated_at: new Date(),
};

const createDto = {
  name: 'prod-web-01',
  provider: 'Hetzner',
  region: 'eu-central',
  ipAddress: '95.216.1.100',
  cpuCores: 4,
  ramGb: 8,
  storageGb: 80,
  environmentId: ENV_ID,
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('ServersService', () => {
  let service: ServersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MetricsService, useValue: mockMetrics },
      ],
    }).compile();

    service = module.get<ServersService>(ServersService);
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('crée un serveur quand l\'environnement existe', async () => {
      mockPrisma.environment.findUnique.mockResolvedValue({ id: ENV_ID });
      mockPrisma.server.create.mockResolvedValue(fakeServer);

      const result = await service.create(createDto);

      expect(result).toEqual(fakeServer);
      expect(mockPrisma.server.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ip_address: '95.216.1.100',
            cpu_cores: 4,
            environment_id: ENV_ID,
          }),
        }),
      );
    });

    it('lance NotFoundException si l\'environnement n\'existe pas', async () => {
      mockPrisma.environment.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.server.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retourne { data, meta } avec la pagination calculée', async () => {
      mockPrisma.$transaction.mockResolvedValue([[fakeServer], 45]);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(result.data).toEqual([fakeServer]);
      expect(result.meta).toEqual({ total: 45, page: 2, limit: 20, totalPages: 3 });
    });
  });

  describe('findOne', () => {
    it('retourne le serveur avec latest_metric', async () => {
      const metric = { id: 'm1', cpu_percent: 42 };
      mockPrisma.server.findUnique.mockResolvedValue({ ...fakeServer, metrics: [metric] });

      const result = await service.findOne(SERVER_ID);

      expect(result.latest_metric).toEqual(metric);
      expect(result).not.toHaveProperty('metrics');
    });

    it('latest_metric vaut null si aucune mesure', async () => {
      mockPrisma.server.findUnique.mockResolvedValue({ ...fakeServer, metrics: [] });

      const result = await service.findOne(SERVER_ID);

      expect(result.latest_metric).toBeNull();
    });

    it('lance NotFoundException si le serveur n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);

      await expect(service.findOne(SERVER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('met à jour les champs fournis', async () => {
      mockPrisma.server.findUnique.mockResolvedValue({ id: SERVER_ID, status: ServerStatus.PROVISIONING });
      mockPrisma.server.update.mockResolvedValue({ ...fakeServer, status: ServerStatus.RUNNING });

      const result = await service.update(SERVER_ID, { status: ServerStatus.RUNNING });

      expect(result.status).toBe(ServerStatus.RUNNING);
      expect(mockPrisma.server.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ServerStatus.RUNNING } }),
      );
    });

    it('lance NotFoundException si le serveur n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);

      await expect(service.update(SERVER_ID, { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('refuse de sortir un serveur TERMINATED de son statut', async () => {
      mockPrisma.server.findUnique.mockResolvedValue({ id: SERVER_ID, status: ServerStatus.TERMINATED });

      await expect(
        service.update(SERVER_ID, { status: ServerStatus.RUNNING }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.server.update).not.toHaveBeenCalled();
    });

    it('vérifie le nouvel environnement s\'il change', async () => {
      mockPrisma.server.findUnique.mockResolvedValue({ id: SERVER_ID, status: ServerStatus.RUNNING });
      mockPrisma.environment.findUnique.mockResolvedValue(null);

      await expect(
        service.update(SERVER_ID, { environmentId: 'unknown-env' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime un serveur existant', async () => {
      mockPrisma.server.findUnique.mockResolvedValue({ id: SERVER_ID });
      mockPrisma.server.delete.mockResolvedValue(fakeServer);

      const result = await service.remove(SERVER_ID);

      expect(mockPrisma.server.delete).toHaveBeenCalledWith({ where: { id: SERVER_ID } });
      expect(result.message).toContain(SERVER_ID);
    });

    it('lance NotFoundException si le serveur n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);

      await expect(service.remove(SERVER_ID)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.server.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('retourne le statut et la disponibilité 24 h', async () => {
      const lastAt = new Date();
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      mockMetrics.getAvailability.mockResolvedValue({ availability_pct: 97.5, total_points: 200 });
      mockPrisma.metric.findFirst.mockResolvedValue({ recorded_at: lastAt });

      const result = await service.getStatus(SERVER_ID);

      expect(result.is_running).toBe(true);
      expect(result.availability_24h_pct).toBe(97.5);
      expect(result.last_metric_at).toBe(lastAt);
    });

    it('lance NotFoundException si le serveur n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);

      await expect(service.getStatus(SERVER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});