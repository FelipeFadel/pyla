import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

// Configuração que depende da instância do app (cookie e CORS). Pipe,
// interceptor e filtro globais vivem no AppModule (APP_PIPE, APP_INTERCEPTOR,
// APP_FILTER).
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
  });
}
