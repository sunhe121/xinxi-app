import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, lt, sql, count } from 'drizzle-orm';
import { xinyuMessages, xinyuBindings, xinyuBroadcasts } from '@server/database/schema';
import type {
  ThinkOfYouResponse,
  XinyuMessage,
  MessageListResponse,
  MessageType,
} from '@shared/api.interface';
import { XinyuBindingsService } from '../xinyu-bindings/xinyu-bindings.service';

@Injectable()
export class XinyuMessagesService {
  private readonly logger = new Logger(XinyuMessagesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly bindingsService: XinyuBindingsService,
  ) {}

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

  async getMessages(
    userId: string,
    bindingId: string,
    cursor?: string,
    limit: number = 30,
  ): Promise<MessageListResponse> {
    await this.validateBindingAccess(userId, bindingId);

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const queryLimit = safeLimit + 1;

    const conditions = [eq(xinyuMessages.bindingId, bindingId)];
    if (cursor) {
      const cursorDate = new Date(cursor);
      conditions.push(lt(xinyuMessages.createdAt, cursorDate));
    }

    const rows = await this.db
      .select()
      .from(xinyuMessages)
      .where(and(...conditions))
      .orderBy(desc(xinyuMessages.createdAt))
      .limit(queryLimit);

    const hasMore = rows.length > safeLimit;
    const items = hasMore ? rows.slice(0, safeLimit) : rows;
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    return {
      items: items.map((row) => this.mapMessage(row)),
      nextCursor,
      hasMore,
    };
  }

  async sendTextMessage(
    userId: string,
    bindingId: string,
    receiverUserId: string,
    content: string,
  ): Promise<XinyuMessage> {
    await this.validateBindingAccess(userId, bindingId);

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('消息内容不能为空');
    }

    const inserted = await this.db
      .insert(xinyuMessages)
      .values({
        bindingId,
        senderUserId: userId,
        receiverUserId,
        messageType: 'text',
        content: content.trim(),
        isReported: false,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return this.mapMessage(inserted[0]);
  }

  async sendFileMessage(
    userId: string,
    bindingId: string,
    receiverUserId: string,
    messageType: 'voice' | 'image' | 'video',
    fileUrl: string,
    content?: string,
    duration?: number,
  ): Promise<XinyuMessage> {
    await this.validateBindingAccess(userId, bindingId);

    if (!fileUrl) {
      throw new BadRequestException('文件地址不能为空');
    }

    const inserted = await this.db
      .insert(xinyuMessages)
      .values({
        bindingId,
        senderUserId: userId,
        receiverUserId,
        messageType,
        content: content ?? '',
        fileUrl,
        duration: duration ?? 0,
        isReported: false,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return this.mapMessage(inserted[0]);
  }

  async getUnreadReportCount(
    userId: string,
    bindingId: string,
  ): Promise<number> {
    const binding = await this.getBindingOrThrow(bindingId);
    const partnerId = binding.userIdA === userId ? binding.userIdB : binding.userIdA;

    const result = await this.db
      .select({ count: count() })
      .from(xinyuBroadcasts)
      .where(
        and(
          eq(xinyuBroadcasts.targetUserId, userId),
          eq(xinyuBroadcasts.userId, partnerId),
          eq(xinyuBroadcasts.direction, 'to_partner'),
          eq(xinyuBroadcasts.isRead, false),
        ),
      );

    return Number(result[0]?.count ?? 0);
  }

  private async validateBindingAccess(
    userId: string,
    bindingId: string,
  ): Promise<void> {
    const binding = await this.getBindingOrThrow(bindingId);
    if (binding.userIdA !== userId && binding.userIdB !== userId) {
      throw new ForbiddenException('无权查看该绑定关系的消息');
    }
  }

  private async getBindingOrThrow(bindingId: string) {
    const rows = await this.db
      .select()
      .from(xinyuBindings)
      .where(eq(xinyuBindings.id, bindingId))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('绑定关系不存在');
    }
    return rows[0];
  }

  private mapMessage(row: typeof xinyuMessages.$inferSelect): XinyuMessage {
    return {
      id: row.id,
      bindingId: row.bindingId,
      senderUserId: row.senderUserId,
      receiverUserId: row.receiverUserId,
      messageType: row.messageType as MessageType,
      content: row.content ?? '',
      fileUrl: row.fileUrl ?? '',
      duration: row.duration ?? 0,
      isReported: row.isReported,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
