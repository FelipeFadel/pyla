// Corpo de sucesso de GET /categories, já no envelope { data } do interceptor.

export class CategoryDto {
  id: string;

  name: string;
}

export class CategoryListEnvelopeDto {
  data: CategoryDto[];
}
