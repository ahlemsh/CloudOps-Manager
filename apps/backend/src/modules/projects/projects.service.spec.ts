import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus, EnvironmentType, RoleName } from '@prisma/client';

// ─── Mock PrismaService ───────────────────────────────────────────────────────

const mockPrisma = {
  project: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  projectMember: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  environment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PROJECT_ID = 'project-uuid-1111';
const USER_ID = 'user-uuid-2222';
const OTHER_USER_ID = 'user-uuid-3333';
const ENV_ID = 'env-uuid-4444';
const MEMBER_ID = 'member-uuid-5555';

const adminUser = { id: USER_ID, email: 'admin@test.com', role: RoleName.ADMIN };
const devopsUser = { id: USER_ID, email: 'devops@test.com', role: RoleName.DEVOPS };
const viewerUser = { id: USER_ID, email: 'viewer@test.com', role: RoleName.VIEWER };

const fakeProject = {
  id: PROJECT_ID,
  name: 'Test Project',
  description: 'A test project',
  status: ProjectStatus.ACTIVE,
  owner_id: USER_ID,
  created_at: new Date(),
  updated_at: new Date(),
  owner: {
    id: USER_ID,
    email: 'admin@test.com',
    first_name: 'Admin',
    last_name: 'User',
  },
  environments: [],
  _count: { members: 2, environments: 1 },
};

const fakeEnvironment = {
  id: ENV_ID,
  name: 'production',
  type: EnvironmentType.PRODUCTION,
  project_id: PROJECT_ID,
  created_at: new Date(),
  _count: { servers: 0 },
};

const fakeMember = {
  id: MEMBER_ID,
  project_id: PROJECT_ID,
  user_id: OTHER_USER_ID,
  assigned_at: new Date(),
  user: {
    id: OTHER_USER_ID,
    email: 'member@test.com',
    first_name: 'Member',
    last_name: 'User',
    role: RoleName.DEVOPS,
  },
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns a paginated response { data, meta }', async () => {
      mockPrisma.$transaction.mockResolvedValue([[fakeProject], 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, adminUser);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('calculates totalPages correctly (25 results, limit 10 → 3 pages)', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 25]);

      const result = await service.findAll({ page: 1, limit: 10 }, adminUser);

      expect(result.meta.totalPages).toBe(3);
    });

    it('applies Viewer filter: only projects where user is owner or member', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10 }, viewerUser);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { owner_id: viewerUser.id },
              { members: { some: { user_id: viewerUser.id } } },
            ],
          }),
        }),
      );
    });

    it('does NOT apply Viewer filter for ADMIN', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10 }, adminUser);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({
          where: expect.objectContaining({ OR: expect.anything() }),
        }),
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a project with owner_id = currentUser.id', async () => {
      mockPrisma.project.create.mockResolvedValue(fakeProject);

      const dto = { name: 'Test Project', description: 'A test project' };
      const result = await service.create(dto, adminUser);

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            owner_id: adminUser.id,
            name: 'Test Project',
          }),
        }),
      );
      expect(result.id).toBe(PROJECT_ID);
    });

    it('defaults status to ACTIVE when not provided', async () => {
      mockPrisma.project.create.mockResolvedValue(fakeProject);

      await service.create({ name: 'Test' }, adminUser);

      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ProjectStatus.ACTIVE }),
        }),
      );
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the project when it exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);

      const result = await service.findOne(PROJECT_ID, adminUser);

      expect(result.id).toBe(PROJECT_ID);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: PROJECT_ID } }),
      );
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown-id', adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for Viewer not owner/member', async () => {
      // Viewer is not the owner and not a member
      const viewer = { id: 'other-viewer-id', email: 'v@test.com', role: RoleName.VIEWER };
      const projectOwnedByOther = { ...fakeProject, owner_id: 'someone-else' };
      mockPrisma.project.findUnique.mockResolvedValue(projectOwnedByOther);
      mockPrisma.projectMember.findFirst.mockResolvedValue(null); // not a member

      await expect(service.findOne(PROJECT_ID, viewer)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows Viewer who is the owner to access the project', async () => {
      const viewer = { id: USER_ID, email: 'v@test.com', role: RoleName.VIEWER };
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject); // owner_id === USER_ID

      const result = await service.findOne(PROJECT_ID, viewer);

      // Should not throw and projectMember.findFirst should NOT be called
      // (short-circuit on owner_id check)
      expect(result.id).toBe(PROJECT_ID);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates a project for ADMIN', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.project.update.mockResolvedValue({ ...fakeProject, name: 'Updated' });

      const result = await service.update(PROJECT_ID, { name: 'Updated' }, adminUser);

      expect(result.name).toBe('Updated');
      expect(mockPrisma.project.update).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { name: 'New' }, adminUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for DevOps not owner/member', async () => {
      const devops = { id: 'other-devops-id', email: 'd@test.com', role: RoleName.DEVOPS };
      // findProjectOrThrow returns project
      mockPrisma.project.findUnique
        .mockResolvedValueOnce(fakeProject) // findProjectOrThrow
        .mockResolvedValueOnce({ ...fakeProject, owner_id: 'someone-else', members: [] }); // assertDevOpsAccess

      await expect(
        service.update(PROJECT_ID, { name: 'New' }, devops),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes a project and returns a confirmation message', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.project.delete.mockResolvedValue(fakeProject);

      const result = await service.remove(PROJECT_ID);

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({ where: { id: PROJECT_ID } });
      expect(result.message).toContain(PROJECT_ID);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('unknown-id')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });
  });

  // ── addMember ─────────────────────────────────────────────────────────────────

  describe('addMember', () => {
    it('adds a member successfully', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.user.findUnique.mockResolvedValue({ id: OTHER_USER_ID, is_active: true });
      mockPrisma.projectMember.findFirst.mockResolvedValue(null); // not yet a member
      mockPrisma.projectMember.create.mockResolvedValue(fakeMember);

      const result = await service.addMember(
        PROJECT_ID,
        { userId: OTHER_USER_ID },
        adminUser,
      );

      expect(mockPrisma.projectMember.create).toHaveBeenCalledTimes(1);
      expect(result.user.id).toBe(OTHER_USER_ID);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(PROJECT_ID, { userId: 'unknown-user' }, adminUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.projectMember.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user is inactive', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.user.findUnique.mockResolvedValue({ id: OTHER_USER_ID, is_active: false });

      await expect(
        service.addMember(PROJECT_ID, { userId: OTHER_USER_ID }, adminUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.projectMember.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when user is already a member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.user.findUnique.mockResolvedValue({ id: OTHER_USER_ID, is_active: true });
      mockPrisma.projectMember.findFirst.mockResolvedValue(fakeMember); // already a member

      await expect(
        service.addMember(PROJECT_ID, { userId: OTHER_USER_ID }, adminUser),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.projectMember.create).not.toHaveBeenCalled();
    });
  });

  // ── removeMember ─────────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('removes a member and returns a confirmation message', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.projectMember.findFirst.mockResolvedValue(fakeMember);
      mockPrisma.projectMember.delete.mockResolvedValue(fakeMember);

      const result = await service.removeMember(PROJECT_ID, OTHER_USER_ID, adminUser);

      expect(mockPrisma.projectMember.delete).toHaveBeenCalledWith({
        where: { id: MEMBER_ID },
      });
      expect(result.message).toContain(OTHER_USER_ID);
    });

    it('throws NotFoundException when user is not a member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMember(PROJECT_ID, 'not-a-member', adminUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.projectMember.delete).not.toHaveBeenCalled();
    });
  });

  // ── getEnvironments ───────────────────────────────────────────────────────────

  describe('getEnvironments', () => {
    it('returns environments with _count.servers', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.environment.findMany.mockResolvedValue([fakeEnvironment]);

      const result = await service.getEnvironments(PROJECT_ID, adminUser);

      expect(result).toHaveLength(1);
      expect(result[0]._count).toBeDefined();
      expect(mockPrisma.environment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { project_id: PROJECT_ID },
          include: { _count: { select: { servers: true } } },
        }),
      );
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.getEnvironments('unknown-project', adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── createEnvironment ─────────────────────────────────────────────────────────

  describe('createEnvironment', () => {
    it('creates an environment for a project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject);
      mockPrisma.environment.create.mockResolvedValue(fakeEnvironment);

      const dto = { name: 'production', type: EnvironmentType.PRODUCTION };
      const result = await service.createEnvironment(PROJECT_ID, dto, adminUser);

      expect(mockPrisma.environment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'production',
            type: EnvironmentType.PRODUCTION,
            project_id: PROJECT_ID,
          }),
        }),
      );
      expect(result.id).toBe(ENV_ID);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.createEnvironment(
          'unknown-project',
          { name: 'test', type: EnvironmentType.DEVELOPMENT },
          adminUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.environment.create).not.toHaveBeenCalled();
    });
  });

  // ── deleteEnvironment ─────────────────────────────────────────────────────────

  describe('deleteEnvironment', () => {
    it('deletes an environment with no servers', async () => {
      mockPrisma.environment.findFirst.mockResolvedValue({
        ...fakeEnvironment,
        _count: { servers: 0 },
      });
      mockPrisma.project.findUnique.mockResolvedValue(fakeProject); // needed by assertDevOpsAccess if called
      mockPrisma.environment.delete.mockResolvedValue(fakeEnvironment);

      const result = await service.deleteEnvironment(PROJECT_ID, ENV_ID, adminUser);

      expect(mockPrisma.environment.delete).toHaveBeenCalledWith({ where: { id: ENV_ID } });
      expect(result.message).toContain(ENV_ID);
    });

    it('throws ConflictException when environment still has servers', async () => {
      mockPrisma.environment.findFirst.mockResolvedValue({
        ...fakeEnvironment,
        _count: { servers: 3 },
      });

      await expect(
        service.deleteEnvironment(PROJECT_ID, ENV_ID, adminUser),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.environment.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when envId does not belong to project', async () => {
      mockPrisma.environment.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteEnvironment(PROJECT_ID, 'wrong-env-id', adminUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.environment.delete).not.toHaveBeenCalled();
    });
  });
});
