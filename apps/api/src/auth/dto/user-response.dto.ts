// Corpos de sucesso das rotas de auth, já no envelope { data } do interceptor.

export class UserDto {
  id: string;

  email: string;
}

export class SessionUserDto extends UserDto {
  role: 'CUSTOMER' | 'ADMIN';
}

export class UserEnvelopeDto {
  data: UserDto;
}

export class SessionUserEnvelopeDto {
  data: SessionUserDto;
}
