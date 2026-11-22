// Corpo de sucesso de GET /categories, já no envelope { data } do interceptor.
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Mercearia' })
  name: string;
}

export class CategoryListEnvelopeDto {
  @ApiProperty({ type: [CategoryDto] })
  data: CategoryDto[];
}
