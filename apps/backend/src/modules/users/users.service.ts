import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash: passwordHash,
        first_name: dto.firstName,
        last_name: dto.lastName,
        role: dto.role ?? RoleName.VIEWER,
        is_active: dto.isActive ?? true,
      },
      select: USER_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string, requesterRole: RoleName) {
    await this.findOne(id);

    if (requesterRole !== RoleName.ADMIN) {
      if (id !== requesterId) {
        throw new ForbiddenException('You can only update your own profile');
      }
      if (dto.role !== undefined) {
        throw new ForbiddenException('Only admins can change roles');
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.firstName !== undefined) data['first_name'] = dto.firstName;
    if (dto.lastName !== undefined) data['last_name'] = dto.lastName;
    if (dto.role !== undefined) data['role'] = dto.role;
    if (dto.isActive !== undefined) data['is_active'] = dto.isActive;
    if (dto.password !== undefined) {
      data['password_hash'] = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `User ${id} deleted` };
  }

  async updateRole(id: string, role: RoleName) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: USER_SELECT,
    });
  }
}
