import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuLanguageStyleService } from './xinyu-language-style.service';
import type {
  AnalyzeLanguageStyleResponse,
  CreateLanguageSampleRequest,
  LanguageSample,
  UpdateLanguageSampleRequest,
} from '@shared/api.interface';

@Controller('api/xinyu/language-style')
export class XinyuLanguageStyleController {
  constructor(private readonly languageStyleService: XinyuLanguageStyleService) {}

  @Get('samples')
  async getSamples(@CurrentUser() user: JwtPayload): Promise<LanguageSample[]> {
    return this.languageStyleService.getSamples(user.userId);
  }

  @Post('samples')
  async createSample(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateLanguageSampleRequest,
  ): Promise<LanguageSample> {
    return this.languageStyleService.createSample(user.userId, body);
  }

  @Patch('samples/:id')
  async updateSample(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateLanguageSampleRequest,
  ): Promise<LanguageSample> {
    return this.languageStyleService.updateSample(user.userId, id, body);
  }

  @Delete('samples/:id')
  async deleteSample(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.languageStyleService.deleteSample(user.userId, id);
  }

  @Post('analyze')
  async analyzeLanguageStyle(
    @CurrentUser() user: JwtPayload,
  ): Promise<AnalyzeLanguageStyleResponse> {
    return this.languageStyleService.analyzeLanguageStyle(user.userId);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload): Promise<AnalyzeLanguageStyleResponse> {
    return this.languageStyleService.getProfile(user.userId);
  }
}
