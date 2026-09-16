import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuBroadcastsService } from './xinyu-broadcasts.service';
import type {
  Broadcast,
  GenerateBroadcastRequest,
  GenerateBroadcastResponse,
  ReplyBroadcastRequest,
} from '@shared/api.interface';

interface DailyReportRequest {
  targetUserId: string;
  direction?: 'to_partner' | 'from_partner';
  toneStyle?: 'warm_chatter' | 'warm_concise' | 'humorous' | 'gentle';
}

interface DailyReportResponse {
  broadcastId: string;
  content: string;
}

interface BroadcastListResponse {
  items: Broadcast[];
  total: number;
  page: number;
  pageSize: number;
}

@Controller('api/xinyu/broadcasts')
export class XinyuBroadcastsController {
  constructor(private readonly broadcastsService: XinyuBroadcastsService) {}

  @Get('inbox')
  async getInbox(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('familyId') familyId?: string,
  ): Promise<BroadcastListResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.broadcastsService.getInbox(user.userId, pageNum, pageSizeNum, familyId);
  }

  @Get()
  async getList(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<BroadcastListResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.broadcastsService.getList(user.userId, pageNum, pageSizeNum, targetUserId);
  }

  @Post('generate')
  async generate(
    @CurrentUser() user: JwtPayload,
    @Body() body: GenerateBroadcastRequest,
  ): Promise<GenerateBroadcastResponse> {
    return this.broadcastsService.generate(
      user.userId,
      body.targetUserId,
      body.relation,
      body.direction ?? 'to_partner',
      body.toneStyle,
    );
  }

  @Post('daily-report')
  async generateDailyReport(
    @CurrentUser() user: JwtPayload,
    @Body() body: DailyReportRequest,
  ): Promise<DailyReportResponse> {
    return this.broadcastsService.generateDailyReport(
      user.userId,
      body.targetUserId,
      body.direction ?? 'to_partner',
      body.toneStyle ?? 'warm_chatter',
    );
  }

  @Get(':id')
  async getDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Broadcast> {
    return this.broadcastsService.getById(id, user.userId);
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Broadcast> {
    return this.broadcastsService.markAsRead(id, user.userId);
  }

  @Post(':id/reply')
  async replyToBroadcast(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: ReplyBroadcastRequest,
  ): Promise<Broadcast> {
    return this.broadcastsService.replyToBroadcast(id, user.userId, body.content, body.audioUrl);
  }
}
