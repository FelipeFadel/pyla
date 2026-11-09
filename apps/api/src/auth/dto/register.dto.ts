import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const MAX_PASSWORD_BYTES = 72;

// O bcrypt considera só os primeiros 72 bytes, então o limite é em bytes UTF-8.
@ValidatorConstraint({ name: 'maxBytes', async: false })
class MaxBytesConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      typeof value === 'string' &&
      Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES
    );
  }

  defaultMessage(): string {
    return 'A senha deve ter no máximo 72 bytes (caracteres acentuados ocupam mais de um).';
  }
}

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @Validate(MaxBytesConstraint)
  @Matches(/\p{L}/u, { message: 'A senha deve conter ao menos uma letra.' })
  @Matches(/\d/, { message: 'A senha deve conter ao menos um número.' })
  password: string;
}
