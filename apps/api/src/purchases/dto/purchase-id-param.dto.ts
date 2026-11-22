import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PurchaseIdParamDto {
  @ApiProperty({ description: 'Id da compra.', format: 'uuid' })
  @IsUUID('all', { message: 'O id da compra deve ser um UUID válido.' })
  id: string;
}
