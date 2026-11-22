// Corpo de sucesso de GET /products, já no envelope { data } do interceptor.
import { ApiProperty } from '@nestjs/swagger';

export class ProductCategoryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Mercearia' })
  name: string;
}

export class ProductSummaryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Arroz Branco' })
  name: string;

  @ApiProperty({ type: ProductCategoryDto })
  category: ProductCategoryDto;
}

export class ProductListEnvelopeDto {
  @ApiProperty({ type: [ProductSummaryDto] })
  data: ProductSummaryDto[];
}
