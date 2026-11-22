// Corpo de sucesso de GET /products, já no envelope { data } do interceptor.
import { ApiProperty } from '@nestjs/swagger';

export class ProductCategoryDto {
  id: string;

  name: string;
}

export class ProductSummaryDto {
  id: string;

  name: string;

  category: ProductCategoryDto;
}

export class ProductListEnvelopeDto {
  @ApiProperty({ type: [ProductSummaryDto] })
  data: ProductSummaryDto[];
}
