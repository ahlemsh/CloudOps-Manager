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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Applications')
@ApiBearerAuth('access-token')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // ─── GET /applications ───────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Liste paginée des applications (tous les rôles authentifiés)' })
  @ApiResponse({ status: 200, description: 'Liste paginée : { data, meta }' })
  findAll(@Query() query: QueryApplicationsDto) {
    return this.applicationsService.findAll(query);
  }

  // ─── GET /applications/:id ───────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une application par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l\'application' })
  @ApiResponse({ status: 200, description: 'Application trouvée' })
  @ApiResponse({ status: 404, description: 'Application introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.findOne(id);
  }

  // ─── POST /applications ──────────────────────────────────────────────────────

  @Post()
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Créer une application (ADMIN, DEVOPS)' })
  @ApiResponse({ status: 201, description: 'Application créée' })
  @ApiResponse({ status: 404, description: 'Serveur ou environnement introuvable' })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  // ─── PATCH /applications/:id ─────────────────────────────────────────────────

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Modifier une application (ADMIN, DEVOPS)' })
  @ApiParam({ name: 'id', description: 'UUID de l\'application' })
  @ApiResponse({ status: 200, description: 'Application mise à jour' })
  @ApiResponse({ status: 404, description: 'Application, serveur ou environnement introuvable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, dto);
  }

  // ─── DELETE /applications/:id ────────────────────────────────────────────────

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une application (ADMIN uniquement)' })
  @ApiParam({ name: 'id', description: 'UUID de l\'application' })
  @ApiResponse({ status: 200, description: 'Application supprimée' })
  @ApiResponse({ status: 404, description: 'Application introuvable' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.remove(id);
  }
}
