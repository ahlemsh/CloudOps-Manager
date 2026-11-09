import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { QueryServersDto } from './dto/query-servers.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Servers')
@ApiBearerAuth('access-token')
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  // ─── GET /servers ────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Liste paginée des serveurs (tous les rôles authentifiés)' })
  @ApiResponse({ status: 200, description: 'Liste paginée : { data, meta }' })
  findAll(@Query() query: QueryServersDto) {
    return this.serversService.findAll(query);
  }

  // ─── POST /servers ───────────────────────────────────────────────────────────

  @Post()
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Enregistrer un serveur (ADMIN, DEVOPS)' })
  @ApiResponse({ status: 201, description: 'Serveur créé' })
  @ApiResponse({ status: 404, description: 'Environnement introuvable' })
  create(@Body() dto: CreateServerDto) {
    return this.serversService.create(dto);
  }

  // ─── GET /servers/:id/status ─────────────────────────────────────────────────
  // Déclaré avant GET :id par lisibilité (pas de conflit : segments différents).

  @Get(':id/status')
  @ApiOperation({ summary: 'Statut courant et disponibilité 24 h d\'un serveur' })
  @ApiParam({ name: 'id', description: 'UUID du serveur' })
  @ApiResponse({ status: 200, description: 'Statut et résumé de disponibilité' })
  @ApiResponse({ status: 404, description: 'Serveur introuvable' })
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.serversService.getStatus(id);
  }

  // ─── GET /servers/:id ────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un serveur avec sa dernière mesure' })
  @ApiParam({ name: 'id', description: 'UUID du serveur' })
  @ApiResponse({ status: 200, description: 'Serveur trouvé (champ latest_metric)' })
  @ApiResponse({ status: 404, description: 'Serveur introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serversService.findOne(id);
  }

  // ─── PATCH /servers/:id ──────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Modifier un serveur ou son statut (ADMIN, DEVOPS)' })
  @ApiParam({ name: 'id', description: 'UUID du serveur' })
  @ApiResponse({ status: 200, description: 'Serveur mis à jour' })
  @ApiResponse({ status: 400, description: 'Un serveur TERMINATED ne peut plus changer de statut' })
  @ApiResponse({ status: 404, description: 'Serveur ou environnement introuvable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServerDto,
  ) {
    return this.serversService.update(id, dto);
  }

  // ─── DELETE /servers/:id ─────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un serveur (ADMIN, DEVOPS)',
    description:
      'Supprime aussi en cascade ses applications, métriques, règles d\'alerte et alertes.',
  })
  @ApiParam({ name: 'id', description: 'UUID du serveur' })
  @ApiResponse({ status: 200, description: 'Serveur supprimé' })
  @ApiResponse({ status: 404, description: 'Serveur introuvable' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.serversService.remove(id);
  }
}