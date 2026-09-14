import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '@server/common/guards/jwt-auth.guard';
import {
  AuthService,
  type AuthResponse,
  type LoginDto,
  type RegisterDto,
  type SendSmsCodeDto,
  type SmsCodeResponse,
  type ResetPasswordDto,
  type ResetPasswordResponse,
} from './auth.service';

@Controller('api/xinyu/auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto): Promise<AuthResponse> {
    return this.authService.login(body);
  }

  @Post('send-code')
  async sendCode(@Body() body: SendSmsCodeDto): Promise<SmsCodeResponse> {
    return this.authService.sendSmsCode(body);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto): Promise<ResetPasswordResponse> {
    return this.authService.resetPassword(body);
  }
}
