import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ enum: RoleName, example: RoleName.DEVOPS })
  @IsEnum(RoleName)
  role: RoleName;
}
