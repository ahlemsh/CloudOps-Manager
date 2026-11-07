import { IsString, IsNotEmpty, IsUUID, IsEnum, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertSeverity, AlertOperator, MetricType } from '@prisma/client';

export class CreateAlertRuleDto {
  @ApiProperty({ example: 'High CPU Alert' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid-of-server' })
  @IsUUID()
  serverId: string;

  @ApiProperty({ enum: MetricType, example: MetricType.CPU })
  @IsEnum(MetricType)
  metricType: MetricType;

  @ApiProperty({ enum: AlertOperator, example: AlertOperator.GT })
  @IsEnum(AlertOperator)
  operator: AlertOperator;

  @ApiProperty({ example: 85.0, description: 'Threshold value (e.g. 85 for 85% CPU)' })
  @IsNumber()
  @Min(0)
  threshold: number;

  @ApiProperty({ enum: AlertSeverity, example: AlertSeverity.WARNING })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
