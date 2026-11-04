const REQUIRED_VARIABLES = ['DATABASE_URL', 'JWT_SECRET', 'WEB_ORIGIN'] as const;

// Usado em ConfigModule.forRoot({ validate }). Vazio vale como ausente.
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_VARIABLES.filter((name) => {
    const value = config[name];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`,
    );
  }
  return config;
}
