import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuPrivacyService } from './xinyu-privacy.service';
import type { PrivacySettings, UpdatePrivacyRequest } from '@shared/api.interface';

@Controller('api/xinyu/privacy')
export class XinyuPrivacyController {
  constructor(private readonly privacyService: XinyuPrivacyService) {}

  @Get()
  async getSettings(@CurrentUser() user: JwtPayload): Promise<PrivacySettings> {
    return this.privacyService.getSettings(user.userId);
  }

  @Patch()
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdatePrivacyRequest,
  ): Promise<PrivacySettings> {
    return this.privacyService.updateSettings(user.userId, body);
  }
}
