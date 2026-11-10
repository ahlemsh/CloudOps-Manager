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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { AcknowledgeAlertDto } from './dto/acknowledge-alert.dto';
import { QueryAlertsDto } from './dto/query-alerts.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Alerts')
@ApiBearerAuth('access-token')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('rules')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Create a new alert rule for a server' })
  @ApiResponse({ status: 201, description: 'Alert rule created successfully' })
  createAlertRule(@Body() dto: CreateAlertRuleDto) {
    return this.alertsService.createAlertRule(dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all alert rules (optionally filter by serverId)' })
  @ApiResponse({ status: 200, description: 'List of alert rules' })
  findAllAlertRules(@Query('serverId') serverId?: string) {
    return this.alertsService.findAllAlertRules(serverId);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get a specific alert rule by ID' })
  @ApiParam({ name: 'id', description: 'Alert rule UUID' })
  findOneAlertRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.findOneAlertRule(id);
  }

  @Patch('rules/:id')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Update an alert rule' })
  @ApiParam({ name: 'id', description: 'Alert rule UUID' })
  updateAlertRule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAlertRuleDto) {
    return this.alertsService.updateAlertRule(id, dto);
  }

  @Delete('rules/:id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete an alert rule (Admin only)' })
  @ApiParam({ name: 'id', description: 'Alert rule UUID' })
  removeAlertRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.removeAlertRule(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of alerts' })
  findAllAlerts(@Query() query: QueryAlertsDto) {
    return this.alertsService.findAllAlerts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific alert by ID' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  findOneAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.findOneAlert(id);
  }

  @Patch(':id/acknowledge')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Acknowledge a triggered alert' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  acknowledgeAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AcknowledgeAlertDto,
  ) {
    return this.alertsService.acknowledgeAlert(id, userId, dto);
  }

  @Patch(':id/resolve')
  @Roles(RoleName.ADMIN, RoleName.DEVOPS)
  @ApiOperation({ summary: 'Resolve an acknowledged alert' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  resolveAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.resolveAlert(id);
  }
}
