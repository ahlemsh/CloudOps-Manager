import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AcknowledgeAlertDto {
  @ApiPropertyOptional({ example: 'Investigating the high CPU usage on server-01' })
  @IsString()
  @IsOptional()
  comment?: string;
}
