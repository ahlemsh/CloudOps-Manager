import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertServerExists(serverId: string): Promise<void> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true },
    });
    if (!server) throw new NotFoundException(`Server with id ${serverId} not found`);
  }

  private async assertEnvironmentExists(environmentId: string): Promise<void> {
    const env = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      select: { id: true },
    });
    if (!env) throw new NotFoundException(`Environment with id ${environmentId} not found`);
  }

  async findAll(query: QueryApplicationsDto) {
    const { page = 1, limit = 20, search, status, environmentId, serverId } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
      ...(status && { status }),
      ...(environmentId && { environment_id: environmentId }),
      ...(serverId && { server_id: serverId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: {
          server: { select: { id: true, name: true, provider: true, region: true } },
          environment: { select: { id: true, name: true, type: true } },
        },
        orderBy: { deployed_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        server: { select: { id: true, name: true, provider: true, region: true, status: true } },
        environment: { select: { id: true, name: true, type: true } },
      },
    });

    if (!application) throw new NotFoundException(`Application with id ${id} not found`);
    return application;
  }

  async create(dto: CreateApplicationDto) {
    await this.assertServerExists(dto.serverId);
    await this.assertEnvironmentExists(dto.environmentId);

    return this.prisma.application.create({
      data: {
        name: dto.name,
        version: dto.version,
        status: dto.status,
        server_id: dto.serverId,
        environment_id: dto.environmentId,
      },
      include: {
        server: { select: { id: true, name: true } },
        environment: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async update(id: string, dto: UpdateApplicationDto) {
    await this.findOne(id);

    if (dto.serverId) await this.assertServerExists(dto.serverId);
    if (dto.environmentId) await this.assertEnvironmentExists(dto.environmentId);

    return this.prisma.application.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.version !== undefined && { version: dto.version }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.serverId !== undefined && { server_id: dto.serverId }),
        ...(dto.environmentId !== undefined && { environment_id: dto.environmentId }),
      },
      include: {
        server: { select: { id: true, name: true } },
        environment: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.application.delete({ where: { id } });
    return { message: `Application ${id} deleted successfully` };
  }
}
