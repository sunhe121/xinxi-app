import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuMessagesService } from './xinyu-messages.service';
import type { SendThinkOfYouRequest, ThinkOfYouResponse } from '@shared/api.interface';

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
}
