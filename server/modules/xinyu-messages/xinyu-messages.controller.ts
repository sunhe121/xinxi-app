import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuMessagesService } from './xinyu-messages.service';
import type {
  SendThinkOfYouRequest,
  ThinkOfYouResponse,
  MessageListResponse,
  SendTextMessageRequest,
  SendFileMessageRequest,
  XinyuMessage,
} from '@shared/api.interface';

@Controller('api/xinyu/messages')
export class XinyuMessagesController {
  constructor(private readonly messagesService: XinyuMessagesService) {}

  @Post('think-of-you')
  async sendThinkOfYou(
    @CurrentUser() user: JwtPayload,
    @Body() body: SendThinkOfYouRequest,
  ): Promise<ThinkOfYouResponse> {
    return this.messagesService.sendThinkOfYou(
      user.userId,
      body.targetUserId,
      body.content,
      body.type ?? 'text',
    );
  }

  @Get()
  async getMessages(
    @CurrentUser() user: JwtPayload,
    @Query('bindingId') bindingId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<MessageListResponse> {
    const limitNum = limit ? parseInt(limit, 10) : 30;
    return this.messagesService.getMessages(user.userId, bindingId, cursor, limitNum);
  }

  @Post('text')
  async sendTextMessage(
    @CurrentUser() user: JwtPayload,
    @Body() body: SendTextMessageRequest,
  ): Promise<XinyuMessage> {
    return this.messagesService.sendTextMessage(
      user.userId,
      body.bindingId,
      body.receiverUserId,
      body.content,
    );
  }

  @Post('file')
  async sendFileMessage(
    @CurrentUser() user: JwtPayload,
    @Body() body: SendFileMessageRequest,
  ): Promise<XinyuMessage> {
    return this.messagesService.sendFileMessage(
      user.userId,
      body.bindingId,
      body.receiverUserId,
      body.messageType,
      body.fileUrl,
      body.content,
      body.duration,
    );
  }
}
