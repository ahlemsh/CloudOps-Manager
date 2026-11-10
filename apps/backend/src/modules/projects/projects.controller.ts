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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (all authenticated roles; visibility rules apply)' })
  @ApiResponse({ status: 200, description: 'Paginated list: { data, meta }' })
  findAll(@Query() query: QueryProjectsDto, @CurrentUser() user: any) {
    return this.projectsService.findAll(query, user);
  }

  @Post()
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Create a project (ADMIN, DEVOPS)' })
  @ApiResponse({ status: 201, description: 'Project created' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(dto, user);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiOperation({ summary: 'Get project details with environments and member count' })
  @ApiResponse({ status: 200, description: 'Project found' })
  @ApiResponse({ status: 403, description: 'Forbidden (Viewer not owner/member)' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projectsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiOperation({ summary: 'Update a project (ADMIN; DEVOPS if owner or member)' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiOperation({ summary: 'Delete a project (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }

  @Get(':id/members')
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiOperation({ summary: 'List project members' })
  @ApiResponse({ status: 200, description: 'Member list' })
  getMembers(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projectsService.getMembers(id, user);
  }

  @Post(':id/members')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiOperation({ summary: 'Add a member to a project (ADMIN; DEVOPS if owner or member)' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMemberDto, @CurrentUser() user: any) {
    return this.projectsService.addMember(id, dto, user);
  }

  @Delete(':id/members/:userId')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to remove' })
  @ApiOperation({ summary: 'Remove a member from a project (ADMIN; DEVOPS if owner or member)' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.removeMember(id, userId, user);
  }

  @Get(':id/environments')
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiOperation({ summary: 'List environments for a project (includes server count)' })
  @ApiResponse({ status: 200, description: 'Environment list with _count.servers' })
  getEnvironments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.projectsService.getEnvironments(id, user);
  }

  @Post(':id/environments')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiOperation({ summary: 'Create an environment (ADMIN; DEVOPS if owner or member)' })
  @ApiResponse({ status: 201, description: 'Environment created' })
  createEnvironment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEnvironmentDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.createEnvironment(id, dto, user);
  }

  @Patch(':id/environments/:envId')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'envId', description: 'Environment UUID' })
  @ApiOperation({ summary: 'Update an environment (ADMIN; DEVOPS if owner or member)' })
  @ApiResponse({ status: 200, description: 'Environment updated' })
  @ApiResponse({ status: 404, description: 'Environment not found in project' })
  updateEnvironment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('envId', ParseUUIDPipe) envId: string,
    @Body() dto: UpdateEnvironmentDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.updateEnvironment(id, envId, dto, user);
  }

  @Delete(':id/environments/:envId')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'envId', description: 'Environment UUID' })
  @ApiOperation({ summary: 'Delete an environment (ADMIN; DEVOPS if owner or member; 409 if has servers)' })
  @ApiResponse({ status: 200, description: 'Environment deleted' })
  @ApiResponse({ status: 404, description: 'Environment not found in project' })
  @ApiResponse({ status: 409, description: 'Environment still contains servers' })
  deleteEnvironment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('envId', ParseUUIDPipe) envId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.deleteEnvironment(id, envId, user);
  }
}
