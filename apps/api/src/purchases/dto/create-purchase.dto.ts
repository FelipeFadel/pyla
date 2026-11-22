import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  Max,
  Min,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Unit } from '../../generated/prisma/enums.js';

// Maior Int do Postgres: evita 500 por estouro. O limite de preço é da tarefa 6.
const INT_MAX = 2147483647;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePurchaseItemDto {
  @ApiPropertyOptional({
    description:
      'Produto que o usuário já tem. Use este campo OU name + categoryId.',
    format: 'uuid',
  })
  @ValidateIf((item: CreatePurchaseItemDto) => item.productId !== undefined)
  @IsUUID(undefined, { message: 'O produto deve ser um id válido.' })
  productId?: string;

  @ApiPropertyOptional({
    description: 'Nome do produto (obrigatório sem productId).',
    example: 'Arroz Branco',
  })
  @ValidateIf((item: CreatePurchaseItemDto) => item.productId === undefined)
  @Transform(trim)
  @IsString({ message: 'O nome do produto deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome do produto.' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Categoria fixa do sistema (obrigatória sem productId).',
    format: 'uuid',
  })
  @ValidateIf((item: CreatePurchaseItemDto) => item.productId === undefined)
  @IsUUID(undefined, { message: 'A categoria deve ser um id válido.' })
  categoryId?: string;

  @ApiProperty({ description: 'Quantidade comprada.', example: 2 })
  @IsNumber({}, { message: 'A quantidade deve ser um número.' })
  @IsPositive({ message: 'A quantidade deve ser maior que zero.' })
  quantity: number;

  @ApiProperty({ description: 'Tamanho da embalagem.', example: 5 })
  @IsNumber({}, { message: 'O tamanho da embalagem deve ser um número.' })
  @IsPositive({ message: 'O tamanho da embalagem deve ser maior que zero.' })
  packageSize: number;

  @ApiProperty({ enum: Unit, example: Unit.KG })
  @IsEnum(Unit, { message: 'A unidade é inválida.' })
  unit: Unit;

  @ApiProperty({
    description: 'Preço cheio da embalagem, em centavos.',
    example: 2599,
  })
  @IsInt({ message: 'O preço deve ser um número inteiro de centavos.' })
  @IsPositive({ message: 'O preço deve ser maior que zero.' })
  fullPriceCents: number;

  @ApiPropertyOptional({
    description:
      'Desconto do item, em centavos (padrão 0, no máximo o valor cheio do item).',
    example: 100,
    default: 0,
  })
  @ValidateIf((item: CreatePurchaseItemDto) => item.discountCents !== undefined)
  @IsInt({ message: 'O desconto deve ser um número inteiro de centavos.' })
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  @Max(INT_MAX, { message: 'O desconto é grande demais.' })
  discountCents?: number;
}

export class CreatePurchaseDto {
  @ApiProperty({
    description: 'Data da compra (YYYY-MM-DD).',
    example: '2026-11-22',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data deve estar no formato AAAA-MM-DD.',
  })
  date: string;

  @ApiPropertyOptional({
    description: 'Loja que o usuário já tem. Use este campo OU storeName.',
    format: 'uuid',
  })
  @ValidateIf((dto: CreatePurchaseDto) => dto.storeId !== undefined)
  @IsUUID(undefined, { message: 'A loja deve ser um id válido.' })
  storeId?: string;

  @ApiPropertyOptional({
    description:
      'Nome da loja: reaproveita a do usuário com o mesmo nome ou cria uma nova.',
    example: 'Mercado Bom',
  })
  @ValidateIf((dto: CreatePurchaseDto) => dto.storeName !== undefined)
  @Transform(trim)
  @IsString({ message: 'O nome da loja deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome da loja.' })
  storeName?: string;

  @ApiPropertyOptional({
    description:
      'Total pago na compra, em centavos (no máximo a soma dos itens com desconto). A diferença é o desconto de caixa.',
    example: 2400,
  })
  @ValidateIf((dto: CreatePurchaseDto) => dto.paidTotalCents !== undefined)
  @IsInt({ message: 'O total pago deve ser um número inteiro de centavos.' })
  @Min(0, { message: 'O total pago não pode ser negativo.' })
  @Max(INT_MAX, { message: 'O total pago é grande demais.' })
  paidTotalCents?: number;

  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray({ message: 'Os itens devem ser uma lista.' })
  @ArrayNotEmpty({ message: 'Informe ao menos um item.' })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
