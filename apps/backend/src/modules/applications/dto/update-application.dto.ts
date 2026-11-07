import { PartialType } from '@nestjs/swagger';
import { CreateApplicationDto } from './create-application.dto';

// PartialType de @nestjs/swagger rend tous les champs optionnels
// ET conserve les décorateurs @ApiProperty (contrairement à @nestjs/mapped-types)
export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {}
