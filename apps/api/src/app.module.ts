import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PlansModule } from './plans/plans.module.js';
import { GLOBAL_PROVIDERS } from './common/global-providers.js';
import { validateEnv } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AuthModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService, ...GLOBAL_PROVIDERS],
})
export class AppModule {}
