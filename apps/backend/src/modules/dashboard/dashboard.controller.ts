import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get global dashboard summary',
    description:
      'Returns counters for servers, applications, active alerts, projects, recent alerts, and status distributions.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard summary data' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get latest metrics for monitoring charts',
    description:
      'Returns the latest CPU/RAM/disk metrics. Filter by serverId for a single server or omit for all running servers.',
  })
  @ApiQuery({ name: 'serverId', required: false, description: 'Filter by server UUID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records (default: 50)' })
  @ApiResponse({ status: 200, description: 'Metrics data for charts' })
  getMetrics(
    @Query('serverId') serverId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.dashboardService.getMetrics(serverId, limit);
  }
}
