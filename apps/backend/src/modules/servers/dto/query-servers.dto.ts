import { IsEnum, IsOptional, IsInt, Min, Max, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServerStatus } from '@prisma/client';

export class QueryServersDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Numéro de page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Nombre d\'éléments par page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'web', description: 'Recherche sur le nom ou l\'adresse IP' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ServerStatus, description: 'Filtre par statut' })
  @IsEnum(ServerStatus)
  @IsOptional()
  status?: ServerStatus;

  @ApiPropertyOptional({ example: 'Hetzner', description: 'Filtre par fournisseur' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ example: 'eu-central', description: 'Filtre par région' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: 'uuid-de-l-environnement', description: 'Filtre par environnement' })
  @IsUUID()
  @IsOptional()
  environmentId?: string;
}