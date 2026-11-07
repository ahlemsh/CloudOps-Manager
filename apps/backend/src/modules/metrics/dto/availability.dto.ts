import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityDto {
  @ApiPropertyOptional({
    example: '2026-11-01T00:00:00.000Z',
    description: 'Début de la période d\'analyse (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-11-07T23:59:59.999Z',
    description: 'Fin de la période d\'analyse (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  to?: string;
}
