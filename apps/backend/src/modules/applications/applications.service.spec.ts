import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppStatus } from '@prisma/client';

// ─── Mock PrismaService ───────────────────────────────────────────────────────
// On mocke uniquement les méthodes utilisées par ApplicationsService.
// Chaque méthode est un jest.fn() réinitialisé avant chaque test (beforeEach).

const mockPrisma = {
  server: {
    findUnique: jest.fn(),
  },
  environment: {
    findUnique: jest.fn(),
  },
  application: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SERVER_ID = 'server-uuid-1111';
const ENV_ID = 'env-uuid-2222';
const APP_ID = 'app-uuid-3333';

const fakeServer = { id: SERVER_ID };
const fakeEnv = { id: ENV_ID };

const fakeApplication = {
  id: APP_ID,
  name: 'api-gateway',
  version: '1.0.0',
  status: AppStatus.RUNNING,
  server_id: SERVER_ID,
  environment_id: ENV_ID,
  deployed_at: new Date(),
  updated_at: new Date(),
  server: { id: SERVER_ID, name: 'web-01', provider: 'AWS', region: 'eu-west-1' },
  environment: { id: ENV_ID, name: 'prod', type: 'PRODUCTION' },
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);

    // Réinitialise tous les mocks avant chaque test
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crée une application quand le serveur et l\'environnement existent', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      mockPrisma.environment.findUnique.mockResolvedValue(fakeEnv);
      mockPrisma.application.create.mockResolvedValue(fakeApplication);

      const dto = {
        name: 'api-gateway',
        version: '1.0.0',
        serverId: SERVER_ID,
        environmentId: ENV_ID,
      };

      const result = await service.create(dto);

      expect(mockPrisma.server.findUnique).toHaveBeenCalledWith({
        where: { id: SERVER_ID },
        select: { id: true },
      });
      expect(mockPrisma.environment.findUnique).toHaveBeenCalledWith({
        where: { id: ENV_ID },
        select: { id: true },
      });
      expect(mockPrisma.application.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('api-gateway');
    });

    it('lance NotFoundException si le serveur n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null); // serveur absent
      mockPrisma.environment.findUnique.mockResolvedValue(fakeEnv);

      const dto = {
        name: 'api-gateway',
        version: '1.0.0',
        serverId: 'inexistant-server-id',
        environmentId: ENV_ID,
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      // Prisma.application.create ne doit PAS être appelé
      expect(mockPrisma.application.create).not.toHaveBeenCalled();
    });

    it('lance NotFoundException si l\'environnement n\'existe pas', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(fakeServer);
      mockPrisma.environment.findUnique.mockResolvedValue(null); // env absent

      const dto = {
        name: 'api-gateway',
        version: '1.0.0',
        serverId: SERVER_ID,
        environmentId: 'inexistant-env-id',
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.application.create).not.toHaveBeenCalled();
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retourne l\'application si elle existe', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(fakeApplication);

      const result = await service.findOne(APP_ID);

      expect(result.id).toBe(APP_ID);
      expect(mockPrisma.application.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: APP_ID } }),
      );
    });

    it('lance NotFoundException si l\'application est introuvable', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findAll (pagination) ──────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retourne une réponse paginée { data, meta }', async () => {
      const fakeList = [fakeApplication];
      // $transaction reçoit un tableau de promesses ; on simule le résultat
      mockPrisma.$transaction.mockResolvedValue([fakeList, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('calcule correctement totalPages', async () => {
      // 25 applications, limit 10 → 3 pages
      mockPrisma.$transaction.mockResolvedValue([[], 25]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('applique le filtre search (name contains)', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, search: 'gateway' });

      // Vérifie que findMany a été appelé avec le filtre name contains
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'gateway', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('applique le filtre serverId', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, serverId: SERVER_ID });

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ server_id: SERVER_ID }),
        }),
      );
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('supprime l\'application et retourne un message de confirmation', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(fakeApplication);
      mockPrisma.application.delete.mockResolvedValue(fakeApplication);

      const result = await service.remove(APP_ID);

      expect(mockPrisma.application.delete).toHaveBeenCalledWith({ where: { id: APP_ID } });
      expect(result.message).toContain(APP_ID);
    });

    it('lance NotFoundException si l\'application à supprimer n\'existe pas', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);

      await expect(service.remove('unknown-id')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.application.delete).not.toHaveBeenCalled();
    });
  });
});
