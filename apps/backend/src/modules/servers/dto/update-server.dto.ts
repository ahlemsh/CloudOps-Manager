import { PartialType } from '@nestjs/swagger';
import { CreateServerDto } from './create-server.dto';

// PartialType de @nestjs/swagger rend tous les champs optionnels
// ET conserve les décorateurs @ApiProperty
export class UpdateServerDto extends PartialType(CreateServerDto) {}