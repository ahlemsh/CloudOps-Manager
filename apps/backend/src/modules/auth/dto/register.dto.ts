import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleName } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@cloudops.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret1234!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ enum: RoleName, default: RoleName.VIEWER })
  @IsEnum(RoleName)
  @IsOptional()
  role?: RoleName;
}
