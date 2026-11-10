import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServerStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { QueryServersDto } from './dto/query-servers.dto';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  private async assertEnvironmentExists(environmentId: string): Promise<void> {
    const env = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      select: { id: true },
    });
    if (!env) {
      throw new NotFoundException(`Environment with id ${environmentId} not found`);
    }
  }

  async findAll(query: QueryServersDto) {
    const { page = 1, limit = 20, search, status, provider, region, environmentId } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { ip_address: { contains: search } },
        ],
      }),
      ...(status && { status }),
      ...(provider && { provider: { equals: provider, mode: 'insensitive' as const } }),
      ...(region && { region: { equals: region, mode: 'insensitive' as const } }),
      ...(environmentId && { environment_id: environmentId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.server.findMany({
        where,
        include: {
          environment: { select: { id: true, name: true, type: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.server.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            type: true,
            project: { select: { id: true, name: true } },
          },
        },
        applications: {
          select: { id: true, name: true, version: true, status: true },
          orderBy: { deployed_at: 'desc' },
        },
        metrics: { orderBy: { recorded_at: 'desc' }, take: 1 },
      },
    });

    if (!server) throw new NotFoundException(`Server with id ${id} not found`);

    const { metrics, ...rest } = server;
    return { ...rest, latest_metric: metrics[0] ?? null };
  }

  async create(dto: CreateServerDto) {
    await this.assertEnvironmentExists(dto.environmentId);

    return this.prisma.server.create({
      data: {
        name: dto.name,
        provider: dto.provider,
        region: dto.region,
        ip_address: dto.ipAddress,
        cpu_cores: dto.cpuCores,
        ram_gb: dto.ramGb,
        storage_gb: dto.storageGb,
        status: dto.status,
        environment_id: dto.environmentId,
      },
      include: {
        environment: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async update(id: string, dto: UpdateServerDto) {
    const existing = await this.prisma.server.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException(`Server with id ${id} not found`);

    if (
      dto.status !== undefined &&
      existing.status === ServerStatus.TERMINATED &&
      dto.status !== ServerStatus.TERMINATED
    ) {
      throw new BadRequestException('A TERMINATED server cannot change status');
    }

    if (dto.environmentId) {
      await this.assertEnvironmentExists(dto.environmentId);
    }

    return this.prisma.server.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.provider !== undefined && { provider: dto.provider }),
        ...(dto.region !== undefined && { region: dto.region }),
        ...(dto.ipAddress !== undefined && { ip_address: dto.ipAddress }),
        ...(dto.cpuCores !== undefined && { cpu_cores: dto.cpuCores }),
        ...(dto.ramGb !== undefined && { ram_gb: dto.ramGb }),
        ...(dto.storageGb !== undefined && { storage_gb: dto.storageGb }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.environmentId !== undefined && { environment_id: dto.environmentId }),
      },
      include: {
        environment: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.server.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Server with id ${id} not found`);

    await this.prisma.server.delete({ where: { id } });
    return { message: `Server ${id} deleted successfully` };
  }

  async getStatus(id: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, created_at: true, updated_at: true },
    });
    if (!server) throw new NotFoundException(`Server with id ${id} not found`);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [availability, lastMetric] = await Promise.all([
      this.metricsService.getAvailability(id, { from: since.toISOString() }),
      this.prisma.metric.findFirst({
        where: { server_id: id },
        orderBy: { recorded_at: 'desc' },
        select: { recorded_at: true },
      }),
    ]);

    return {
      id: server.id,
      name: server.name,
      status: server.status,
      is_running: server.status === ServerStatus.RUNNING,
      last_metric_at: lastMetric?.recorded_at ?? null,
      availability_24h_pct: availability.availability_pct,
      points_24h: availability.total_points,
      created_at: server.created_at,
      updated_at: server.updated_at,
    };
  }
}
