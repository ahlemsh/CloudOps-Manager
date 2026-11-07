import { IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMetricsDto {
  @ApiPropertyOptional({
    example: '2026-11-01T00:00:00.000Z',
    description: 'Date de début (ISO 8601) — borne inférieure de recorded_at',
  })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-11-07T23:59:59.999Z',
    description: 'Date de fin (ISO 8601) — borne supérieure de recorded_at',
  })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    example: 100,
    default: 100,
    description: 'Nombre maximum de points retournés (max 1000)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number = 100;
}
