import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'A project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
