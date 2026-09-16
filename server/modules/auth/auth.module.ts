import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const DEFAULT_JWT_SECRET = 'xinxi-secret-key-change-in-production';
const logger = new Logger('AuthModule');

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || DEFAULT_JWT_SECRET;
        if (secret === DEFAULT_JWT_SECRET) {
          logger.warn('=== 安全警告：正在使用默认 JWT_SECRET！请设置 JWT_SECRET 环境变量！ ===');
        }
        return {
          secret,
          signOptions: { expiresIn: '30d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule, AuthService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit(): void {
    logger.log('AuthModule initialized');
  }
}
