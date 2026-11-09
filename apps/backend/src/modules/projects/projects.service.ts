import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleName, ProjectStatus } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';

// currentUser shape from JWT strategy: { id: string, email: string, role: RoleName }
export interface CurrentUser {
  id: string;
  email: string;
  role: RoleName;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── HELPER: check if a DevOps user is owner or member of a project ────────
  private async assertDevOpsAccess(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        owner_id: true,
        members: { where: { user_id: userId }, select: { id: true } },
      },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.owner_id !== userId && project.members.length === 0) {
      throw new ForbiddenException(
        'DevOps users can only modify projects they own or are a member of',
      );
    }
  }

  // ─── HELPER: check if a Viewer has access to a project ────────────────────
  private async assertViewerAccess(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        owner_id: true,
        members: { where: { user_id: userId }, select: { id: true } },
      },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.owner_id !== userId && project.members.length === 0) {
      throw new ForbiddenException(
        'Viewers can only access projects they own or are a member of',
      );
    }
  }

  // ─── HELPER: get a project ensuring it exists ─────────────────────────────
  private async findProjectOrThrow(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return project;
  }

  // ─── findAll ───────────────────────────────────────────────────────────────
  async findAll(query: QueryProjectsDto, currentUser: CurrentUser) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    // Viewer: only sees projects where they are owner or member
    if (currentUser.role === RoleName.VIEWER) {
      where.OR = [
        { owner_id: currentUser.id },
        { members: { some: { user_id: currentUser.id } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: { id: true, email: true, first_name: true, last_name: true },
          },
          _count: { select: { members: true, environments: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.project.count({ where }),
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

  // ─── create ────────────────────────────────────────────────────────────────
  async create(dto: CreateProjectDto, currentUser: CurrentUser) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status ?? ProjectStatus.ACTIVE,
        owner_id: currentUser.id,
      },
      include: {
        owner: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
      },
    });
  }

  // ─── findOne ───────────────────────────────────────────────────────────────
  // NOTE: For Viewers not owner/member, we throw ForbiddenException (403) rather
  // than NotFoundException (404). This avoids leaking project existence while
  // still being consistent for authenticated users.
  async findOne(id: string, currentUser: CurrentUser) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        environments: true,
        _count: { select: { members: true } },
      },
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);

    if (currentUser.role === RoleName.VIEWER) {
      const isMember = await this.prisma.projectMember.findFirst({
        where: { project_id: id, user_id: currentUser.id },
      });
      if (project.owner_id !== currentUser.id && !isMember) {
        throw new ForbiddenException(
          'Viewers can only access projects they own or are a member of',
        );
      }
    }

    return project;
  }

  // ─── update ────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateProjectDto, currentUser: CurrentUser) {
    await this.findProjectOrThrow(id);

    if (currentUser.role === RoleName.DEVOPS) {
      await this.assertDevOpsAccess(id, currentUser.id);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        owner: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
      },
    });
  }

  // ─── remove ────────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.findProjectOrThrow(id);
    await this.prisma.project.delete({ where: { id } });
    return { message: `Project ${id} deleted successfully` };
  }

  // ─── getMembers ────────────────────────────────────────────────────────────
  async getMembers(projectId: string, currentUser: CurrentUser) {
    await this.findProjectOrThrow(projectId);

    if (currentUser.role === RoleName.VIEWER) {
      await this.assertViewerAccess(projectId, currentUser.id);
    }

    const members = await this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
      orderBy: { assigned_at: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user_id,
      projectId: m.project_id,
      assignedAt: m.assigned_at,
      email: m.user.email,
      firstName: m.user.first_name,
      lastName: m.user.last_name,
      role: m.user.role,
    }));
  }

  // ─── addMember ─────────────────────────────────────────────────────────────
  async addMember(projectId: string, dto: AddMemberDto, currentUser: CurrentUser) {
    await this.findProjectOrThrow(projectId);

    if (currentUser.role === RoleName.DEVOPS) {
      await this.assertDevOpsAccess(projectId, currentUser.id);
    }

    // User must exist and be active
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, is_active: true },
    });
    if (!user || !user.is_active) {
      throw new NotFoundException(`User ${dto.userId} not found or not active`);
    }

    // Check not already a member (unique constraint project_id + user_id)
    const existing = await this.prisma.projectMember.findFirst({
      where: { project_id: projectId, user_id: dto.userId },
    });
    if (existing) {
      throw new ConflictException(`User ${dto.userId} is already a member of this project`);
    }

    return this.prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: dto.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
    });
  }

  // ─── removeMember ──────────────────────────────────────────────────────────
  async removeMember(projectId: string, userId: string, currentUser: CurrentUser) {
    await this.findProjectOrThrow(projectId);

    if (currentUser.role === RoleName.DEVOPS) {
      await this.assertDevOpsAccess(projectId, currentUser.id);
    }

    const member = await this.prisma.projectMember.findFirst({
      where: { project_id: projectId, user_id: userId },
    });
    if (!member) {
      throw new NotFoundException(`User ${userId} is not a member of project ${projectId}`);
    }

    await this.prisma.projectMember.delete({ where: { id: member.id } });
    return { message: `Member ${userId} removed successfully from project ${projectId}` };
  }

  // ─── getEnvironments ───────────────────────────────────────────────────────
  async getEnvironments(projectId: string, currentUser: CurrentUser) {
    await this.findProjectOrThrow(projectId);

    if (currentUser.role === RoleName.VIEWER) {
      await this.assertViewerAccess(projectId, currentUser.id);
    }

    return this.prisma.environment.findMany({
      where: { project_id: projectId },
      include: { _count: { select: { servers: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  // ─── createEnvironment ─────────────────────────────────────────────────────
  async createEnvironment(
    projectId: string,
    dto: CreateEnvironmentDto,
    currentUser: CurrentUser,
  ) {
    await this.findProjectOrThrow(projectId);

    if (currentUser.role === RoleName.DEVOPS) {
      await this.assertDevOpsAccess(projectId, currentUser.id);
    }

    return this.prisma.environment.create({
      data: {
        name: dto.name,
        type: dto.type,
        project_id: projectId,
      },
    });
  }

  // ─── updateEnvironment ─────────────────────────────────────────────────────
  async updateEnvironment(
    projectId: string,
    envId: string,
    dto: UpdateEnvironmentDto,
    currentUser: CurrentUser,
  ) {
    // Verify envId belongs to this project
    const env = await this.prisma.environment.findFirst({
      where: { id: envId, project_id: projectId },
    });
    if (!env) {
      throw new NotFoundException(
        `Environment ${envId} not found in project ${projectId}`,
      );
    }

    if (currentUser.role === RoleName.DEVOPS) {
      await this.assertDevOpsAccess(projectId, currentUser.id);
    }

    return this.prisma.environment.update({
      where: { id: envId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
      },
    });
  }

  // ─── deleteEnvironment ─────────────────────────────────────────────────────
  // NOTE: schema.prisma has onDelete: Cascade on Server → Environment, meaning
  // Prisma would cascade-delete servers if environment.delete() is called.
  // The business rule explicitly forbids this via the API: check _count.servers
  // first and throw ConflictException (409) rather than allowing silent cascade.
  async deleteEnvironment(
    projectId: string,
    envId: string,
    currentUser: CurrentUser,
  ) {
    // Verify envId belongs to this project
    const env = await this.prisma.environment.findFirst({
      where: { id: envId, project_id: projectId },
      include: { _count: { select: { servers: true } } },
    });
    if (!env) {
      throw new NotFoundException(
        `Environment ${envId} not found in project ${projectId}`,
      );
    }

    // Refuse if environment still has servers (business rule: no cascade delete via API)
    if (env._count.servers > 0) {
      throw new ConflictException(
        `Cannot delete environment ${envId}: it still contains ${env._count.servers} server(s). Remove all servers first.`,
      );
    }

    if (currentUser.role === RoleName.DEVOPS) {
      await this.assertDevOpsAccess(projectId, currentUser.id);
    }

    await this.prisma.environment.delete({ where: { id: envId } });
    return { message: `Environment ${envId} deleted successfully` };
  }
}
