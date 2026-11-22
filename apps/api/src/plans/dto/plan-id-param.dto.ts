import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PlanIdParamDto {
  @ApiProperty({ description: 'Id do plano.', format: 'uuid' })
  @IsUUID('all', { message: 'O id do plano deve ser um UUID válido.' })
  id: string;
}
