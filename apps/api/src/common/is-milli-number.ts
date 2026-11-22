import { ValidateBy, type ValidationOptions } from 'class-validator';

// Número finito com no máximo 3 casas decimais. Existe porque o
// `maxDecimalPlaces` do class-validator quebra (TypeError → 500) com notação
// exponencial, como 1e-7. Em milésimos o erro de float é bem menor que 1e-6.
export function IsMilliNumber(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isMilliNumber',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'number' &&
          Number.isFinite(value) &&
          Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6,
      },
    },
    validationOptions,
  );
}
