import { IsEnum, IsOptional, IsInt, Min, Max, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppStatus } from '@prisma/client';

export class QueryApplicationsDto {
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

  @ApiPropertyOptional({
    example: 'api',
    description: 'Recherche textuelle sur le nom de l\'application',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: AppStatus,
    description: 'Filtre par statut',
  })
  @IsEnum(AppStatus)
  @IsOptional()
  status?: AppStatus;

  @ApiPropertyOptional({
    example: 'uuid-de-l-environnement',
    description: 'Filtre par ID d\'environnement',
  })
  @IsUUID()
  @IsOptional()
  environmentId?: string;

  @ApiPropertyOptional({
    example: 'uuid-du-serveur',
    description: 'Filtre par ID de serveur',
  })
  @IsUUID()
  @IsOptional()
  serverId?: string;
}
