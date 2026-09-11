import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuRecordingsService } from './xinyu-recordings.service';
import type { Recording } from '@shared/api.interface';

interface SaveRecordingBody {
  audioUrl: string;
  duration: number;
}

@Controller('api/xinyu/recordings')
export class XinyuRecordingsController {
  constructor(private readonly recordingsService: XinyuRecordingsService) {}

  @Get()
  async getList(@CurrentUser() user: JwtPayload, @Query('category') category?: string): Promise<Recording[]> {
    return this.recordingsService.getList(user.userId, category);
  }

  @Patch(':id')
  async saveRecording(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: SaveRecordingBody,
  ): Promise<Recording> {
    try {
      return await this.recordingsService.saveRecording(user.userId, id, body.audioUrl, body.duration);
    } catch {
      throw new NotFoundException('录音不存在');
    }
  }

  @Delete(':id')
  async deleteRecording(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    try {
      await this.recordingsService.deleteRecording(user.userId, id);
    } catch {
      throw new NotFoundException('录音不存在');
    }
  }

  @Post('sync-to-family')
  async syncToFamily(@CurrentUser() user: JwtPayload): Promise<{ success: boolean }> {
    await this.recordingsService.syncToFamily(user.userId);
    return { success: true };
  }
}
