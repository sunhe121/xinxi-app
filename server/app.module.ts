import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { XinyuUsersModule } from './modules/xinyu-users/xinyu-users.module';
import { XinyuBindingsModule } from './modules/xinyu-bindings/xinyu-bindings.module';
import { XinyuDailyDataModule } from './modules/xinyu-daily-data/xinyu-daily-data.module';
import { XinyuBroadcastsModule } from './modules/xinyu-broadcasts/xinyu-broadcasts.module';
import { XinyuWeatherModule } from './modules/xinyu-weather/xinyu-weather.module';
import { XinyuRecordingsModule } from './modules/xinyu-recordings/xinyu-recordings.module';
import { XinyuPrivacyModule } from './modules/xinyu-privacy/xinyu-privacy.module';
import { XinyuMessagesModule } from './modules/xinyu-messages/xinyu-messages.module';
import { XinyuUploadModule } from './modules/xinyu-upload/xinyu-upload.module';
import { XinyuReportModule } from './modules/xinyu-report/xinyu-report.module';
import { XinyuLanguageStyleModule } from './modules/xinyu-language-style/xinyu-language-style.module';
import { RlsBootstrapModule } from './modules/rls-bootstrap/rls-bootstrap.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    AuthModule,
    AiModule,
    // ====== @route-section: business-modules START ======
    // Place all business modules here.Do NOT add fallback modules here.
    XinyuWeatherModule,
    XinyuRecordingsModule,
    XinyuUsersModule,
    XinyuBindingsModule,
    XinyuDailyDataModule,
    XinyuBroadcastsModule,
    XinyuPrivacyModule,
    XinyuMessagesModule,
    XinyuUploadModule,
    XinyuReportModule,
    XinyuLanguageStyleModule,
    RlsBootstrapModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
