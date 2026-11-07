import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppStatus } from '@prisma/client';

export class CreateApplicationDto {
  @ApiProperty({ example: 'api-gateway', description: 'Nom de l\'application' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '1.4.2', description: 'Version déployée' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version: string;

  @ApiPropertyOptional({
    enum: AppStatus,
    default: AppStatus.DEPLOYING,
    description: 'Statut initial de l\'application',
  })
  @IsEnum(AppStatus)
  @IsOptional()
  status?: AppStatus;

  @ApiProperty({ example: 'uuid-du-serveur', description: 'ID du serveur cible' })
  @IsUUID()
  @IsNotEmpty()
  serverId: string;

  @ApiProperty({ example: 'uuid-de-l-environnement', description: 'ID de l\'environnement' })
  @IsUUID()
  @IsNotEmpty()
  environmentId: string;
}
