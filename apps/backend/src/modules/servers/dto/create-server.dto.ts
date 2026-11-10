import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsIP,
  IsInt,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServerStatus } from '@prisma/client';

export class CreateServerDto {
  @ApiProperty({ example: 'prod-web-01', description: 'Nom du serveur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'Hetzner', description: 'Fournisseur (AWS, Hetzner, OVH...)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provider: string;

  @ApiProperty({ example: 'eu-central', description: 'Région ou datacenter' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region: string;

  @ApiProperty({ example: '95.216.1.100', description: 'Adresse IP publique (IPv4 ou IPv6)' })
  @IsIP()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({ example: 4, description: 'Nombre de cœurs CPU' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cpuCores: number;

  @ApiProperty({ example: 8, description: 'RAM en Go' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  ramGb: number;

  @ApiProperty({ example: 80, description: 'Stockage en Go' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  storageGb: number;

  @ApiPropertyOptional({
    enum: ServerStatus,
    default: ServerStatus.PROVISIONING,
    description:
      'Statut initial. Le simulateur de métriques ne traite que les serveurs RUNNING.',
  })
  @IsEnum(ServerStatus)
  @IsOptional()
  status?: ServerStatus;

  @ApiProperty({ example: '05f46872-7310-4404-ac2d-48efd94639a8', description: "UUID de l'environnement" })
  @IsUUID()
  @IsNotEmpty()
  environmentId: string;
}