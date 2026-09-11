import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import type { ThinkOfYouResponse } from '@shared/api.interface';
import { XinyuBindingsService } from '../xinyu-bindings/xinyu-bindings.service';

@Injectable()
export class XinyuMessagesService {
  private readonly logger = new Logger(XinyuMessagesService.name);

  constructor(private readonly bindingsService: XinyuBindingsService) {}

  async sendThinkOfYou(
    userId: string,
    targetUserId: string,
    content: string,
    type: string = 'text',
  ): Promise<ThinkOfYouResponse> {
    const familyMembers = await this.bindingsService.getFamilyList(userId);
    const isFamily = familyMembers.some((m) => m.userId === targetUserId);
    if (!isFamily) {
      throw new ForbiddenException('只能向已绑定的家人发送消息');
    }

    this.logger.log(
      `想TA了消息已发送: from=${userId}, to=${targetUserId}, type=${type}, contentLength=${content.length}`,
    );

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    return {
      success: true,
      messageId,
    };
  }
}
