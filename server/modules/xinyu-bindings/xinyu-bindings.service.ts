import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuBindings, xinyuInviteCodes, xinyuBroadcasts, xinyuDailyData } from '@server/database/schema';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import { RELATION_LABELS, type FamilyMember, type FamilyMemberDetail, type FamilyRelation } from '@shared/api.interface';
import { XinyuUsersService } from '../xinyu-users/xinyu-users.service';
import { XinyuDailyDataService } from '../xinyu-daily-data/xinyu-daily-data.service';

@Injectable()
export class XinyuBindingsService {
  private readonly logger = new Logger(XinyuBindingsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly usersService: XinyuUsersService,
    private readonly dailyDataService: XinyuDailyDataService,
  ) {}

  async getMemberDetail(userId: string, memberUserId: string): Promise<FamilyMemberDetail> {
    const familyList = await this.getFamilyList(userId);
    const member = familyList.find((m) => m.userId === memberUserId);
    if (!member) {
      throw new ForbiddenException('只能查看已绑定家人的详情');
    }

    const memberUser = await this.usersService.findByUserId(memberUserId);
    if (!memberUser) {
      throw new NotFoundException('家人信息不存在');
    }

    const weekData = await this.dailyDataService.getWeekData(memberUserId, memberUser.role);

    const sortedByDateAsc = [...weekData].sort((a, b) => a.dataDate.localeCompare(b.dataDate));

    const today = new Date().toISOString().split('T')[0];
    const todayDailyData = weekData.find((d) => d.dataDate === today) ?? null;

    const weekSteps = sortedByDateAsc.map((d) => ({ date: d.dataDate, steps: d.steps }));
    const weekSleep = sortedByDateAsc.map((d) => ({ date: d.dataDate, hours: d.sleepHours }));

    return {
      id: member.id,
      bindingId: member.bindingId,
      userId: member.userId,
      nickname: member.nickname,
      avatarUrl: member.avatarUrl,
      role: member.role,
      city: member.city,
      relation: member.relation,
      relationLabel: member.relationLabel,
      remarkName: member.remarkName,
      boundAt: member.boundAt,
      hasUnread: member.hasUnread,
      lastActiveAt: member.lastActiveAt,
      lastBroadcastAt: member.lastBroadcastAt,
      unreadReportCount: member.unreadReportCount,
      dailyData: todayDailyData,
      weekSteps,
      weekSleep,
    };
  }

  async getFamilyList(userId: string): Promise<FamilyMember[]> {
    const rows = await this.db
      .select()
      .from(xinyuBindings)
      .where(
        and(
          or(eq(xinyuBindings.userIdA, userId), eq(xinyuBindings.userIdB, userId)),
          eq(xinyuBindings.status, 'bound'),
        ),
      )
      .orderBy(desc(xinyuBindings.boundAt));

    const partnerIds: string[] = [];
    const partnerInfos: Array<{ partnerId: string; binding: typeof rows[0]; isA: boolean }> = [];

    for (const binding of rows) {
      const isA = binding.userIdA === userId;
      const partnerId = isA ? binding.userIdB : binding.userIdA;
      partnerIds.push(partnerId);
      partnerInfos.push({ partnerId, binding, isA });
    }

    // 批量查未读报告数：targetUserId = userId, userId = partner, direction = to_partner, isRead = false
    const reportCounts = new Map<string, number>();
    if (partnerIds.length > 0) {
      const reportRows = await this.db
        .select({
          senderId: xinyuBroadcasts.userId,
          count: sql<number>`count(*)`,
        })
        .from(xinyuBroadcasts)
        .where(
          and(
            eq(xinyuBroadcasts.targetUserId, userId),
            eq(xinyuBroadcasts.direction, 'to_partner'),
            eq(xinyuBroadcasts.isRead, false),
          ),
        )
        .groupBy(xinyuBroadcasts.userId);
      for (const row of reportRows) {
        reportCounts.set(row.senderId, Number(row.count));
      }
    }

    const members: FamilyMember[] = [];
    for (const { partnerId, binding, isA } of partnerInfos) {
      const myRelation = isA ? binding.relationAToB : binding.relationBToA;
      const partner = await this.usersService.findByUserId(partnerId);
      if (!partner) continue;

      const [unreadCount, lastBroadcastRow, lastDailyRow] = await Promise.all([
        this.db
          .select({ count: sql<number>`count(*)` })
          .from(xinyuBroadcasts)
          .where(
            and(
              eq(xinyuBroadcasts.targetUserId, userId),
              eq(xinyuBroadcasts.direction, 'from_partner'),
              eq(xinyuBroadcasts.userId, partnerId),
              eq(xinyuBroadcasts.isRead, false),
            ),
          ),
        this.db
          .select({ createdAt: xinyuBroadcasts.createdAt })
          .from(xinyuBroadcasts)
          .where(
            and(
              eq(xinyuBroadcasts.targetUserId, userId),
              eq(xinyuBroadcasts.direction, 'from_partner'),
              eq(xinyuBroadcasts.userId, partnerId),
            ),
          )
          .orderBy(desc(xinyuBroadcasts.createdAt))
          .limit(1),
        this.db
          .select({ dataDate: xinyuDailyData.dataDate })
          .from(xinyuDailyData)
          .where(eq(xinyuDailyData.userId, partnerId))
          .orderBy(desc(xinyuDailyData.dataDate))
          .limit(1),
      ]);

      const relation = (myRelation as FamilyRelation) || 'other';
      const myRemark = isA ? binding.remarkNameA : binding.remarkNameB;
      const unreadReport = reportCounts.get(partnerId) ?? 0;
      members.push({
        id: partner.id,
        bindingId: binding.id,
        userId: partner.userId,
        nickname: partner.nickname,
        avatarUrl: partner.avatarUrl,
        role: partner.role,
        city: partner.city,
        relation,
        relationLabel: RELATION_LABELS[relation],
        remarkName: myRemark ?? '',
        boundAt: binding.boundAt ? binding.boundAt.toISOString() : '',
        hasUnread: Number(unreadCount[0]?.count ?? 0) > 0,
        lastActiveAt: lastDailyRow[0]?.dataDate
          ? String(lastDailyRow[0].dataDate)
          : '',
        lastBroadcastAt: lastBroadcastRow[0]?.createdAt
          ? lastBroadcastRow[0].createdAt.toISOString()
          : '',
        unreadReportCount: unreadReport,
      });
    }
    return members;
  }

  async createInviteCode(
    userId: string,
    relation: FamilyRelation,
  ): Promise<{ code: string; expiresAt: string; relation: FamilyRelation }> {
    this.logger.log(`[createInviteCode] userId=${userId}, relation=${relation}`);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existingActive = await this.db
      .select({ id: xinyuInviteCodes.id })
      .from(xinyuInviteCodes)
      .where(
        and(
          eq(xinyuInviteCodes.userId, userId),
          eq(xinyuInviteCodes.status, 'active'),
        ),
      )
      .limit(1);

    if (existingActive.length > 0) {
      this.logger.log(`[createInviteCode] 作废旧邀请码: userId=${userId}, oldId=${existingActive[0].id}`);
      await this.db
        .update(xinyuInviteCodes)
        .set({ status: 'expired' })
        .where(eq(xinyuInviteCodes.id, existingActive[0].id));
    }

    let code = '';
    let inserted = false;
    for (let attempt = 0; attempt < 10 && !inserted; attempt += 1) {
      code = this.generateSixDigitCode();
      try {
        await this.db.insert(xinyuInviteCodes).values({
          userId,
          code,
          relation,
          expiresAt,
          status: 'active',
        });
        inserted = true;
      } catch (error: unknown) {
        const errCode = this.extractPostgresErrorCode(error);
        if (errCode === '23505') {
          this.logger.warn(`[createInviteCode] 邀请码碰撞，重试: code=${code}, attempt=${attempt + 1}`);
          continue;
        }
        this.logger.error(`[createInviteCode] 写入失败: ${JSON.stringify(error)}`);
        throw error;
      }
    }

    if (!inserted) {
      this.logger.error(`[createInviteCode] 生成邀请码失败，重试10次全部碰撞`);
      throw new ConflictException('生成邀请码失败，请重试');
    }

    this.logger.log(`[createInviteCode] 成功: userId=${userId}, code=${code}, expiresAt=${expiresAt.toISOString()}`);
    return { code, expiresAt: expiresAt.toISOString(), relation };
  }

  async redeemInviteCode(
    userId: string,
    code: string,
    myRelation: FamilyRelation,
  ): Promise<FamilyMember> {
    const trimmedCode = code.trim().toUpperCase();
    this.logger.log(`[redeemInviteCode] userId=${userId}, code=${trimmedCode}, myRelation=${myRelation}`);

    if (trimmedCode.length !== 6) {
      throw new BadRequestException('请输入6位邀请码');
    }

    const rows = await this.db
      .select()
      .from(xinyuInviteCodes)
      .where(eq(xinyuInviteCodes.code, trimmedCode))
      .limit(1);

    if (rows.length === 0) {
      this.logger.warn(`[redeemInviteCode] 邀请码不存在: code=${trimmedCode}`);
      throw new NotFoundException('邀请码不存在，请检查后重试');
    }

    const invite = rows[0];
    const creatorId = invite.userId;

    if (creatorId === userId) {
      this.logger.warn(`[redeemInviteCode] 不能绑定自己: userId=${userId}, code=${trimmedCode}`);
      throw new BadRequestException('不能绑定自己的邀请码');
    }

    if (invite.status === 'used') {
      this.logger.warn(`[redeemInviteCode] 邀请码已被使用: code=${trimmedCode}`);
      throw new BadRequestException('邀请码已被使用');
    }

    if (invite.status === 'expired') {
      this.logger.warn(`[redeemInviteCode] 邀请码已过期: code=${trimmedCode}`);
      throw new BadRequestException('邀请码已过期，请重新生成');
    }

    if (invite.status !== 'active') {
      this.logger.warn(`[redeemInviteCode] 邀请码状态无效: code=${trimmedCode}, status=${invite.status}`);
      throw new BadRequestException('邀请码无效');
    }

    const now = new Date();
    if (invite.expiresAt && new Date(invite.expiresAt) < now) {
      this.logger.warn(`[redeemInviteCode] 邀请码已过期: code=${trimmedCode}, expiresAt=${invite.expiresAt}`);
      await this.db
        .update(xinyuInviteCodes)
        .set({ status: 'expired' })
        .where(eq(xinyuInviteCodes.id, invite.id));
      throw new BadRequestException('邀请码已过期，请重新生成');
    }

    const alreadyBound = await this.db
      .select({ id: xinyuBindings.id })
      .from(xinyuBindings)
      .where(
        and(
          or(
            and(eq(xinyuBindings.userIdA, userId), eq(xinyuBindings.userIdB, creatorId)),
            and(eq(xinyuBindings.userIdA, creatorId), eq(xinyuBindings.userIdB, userId)),
          ),
          eq(xinyuBindings.status, 'bound'),
        ),
      )
      .limit(1);

    if (alreadyBound.length > 0) {
      this.logger.warn(`[redeemInviteCode] 已经是家人: userId=${userId}, creatorId=${creatorId}`);
      throw new BadRequestException('你们已经是家人啦');
    }

    const myBoundCount = await this.countBindings(userId);
    if (myBoundCount >= 10) {
      this.logger.warn(`[redeemInviteCode] 已达家人上限: userId=${userId}, count=${myBoundCount}`);
      throw new BadRequestException('最多只能配对10位家人');
    }
    const creatorBoundCount = await this.countBindings(creatorId);
    if (creatorBoundCount >= 10) {
      this.logger.warn(`[redeemInviteCode] 对方已达家人上限: creatorId=${creatorId}, count=${creatorBoundCount}`);
      throw new BadRequestException('对方已达到家人数量上限');
    }

    const creatorRelation = (invite.relation as FamilyRelation) || 'other';
    let insertedId = '';
    let boundAtIso = '';

    try {
      await this.db.transaction(async (tx) => {
        const inserted = await tx
          .insert(xinyuBindings)
          .values({
            userIdA: userId,
            userIdB: creatorId,
            relationAToB: myRelation,
            relationBToA: creatorRelation,
            status: 'bound',
          })
          .returning();

        if (inserted.length === 0) {
          throw new Error('创建绑定关系失败');
        }

        insertedId = inserted[0].id;
        boundAtIso = inserted[0].boundAt
          ? new Date(inserted[0].boundAt).toISOString()
          : '';

        const updated = await tx
          .update(xinyuInviteCodes)
          .set({ status: 'used' })
          .where(
            and(
              eq(xinyuInviteCodes.id, invite.id),
              eq(xinyuInviteCodes.status, 'active'),
            ),
          )
          .returning({ id: xinyuInviteCodes.id });

        if (updated.length === 0) {
          throw new ConflictException('邀请码已被使用，请刷新后重试');
        }
      });
    } catch (error: unknown) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[redeemInviteCode] 事务失败: ${JSON.stringify(error)}`);
      throw new BadRequestException('配对失败，请稍后重试');
    }

    const creator = await this.usersService.findByUserId(creatorId);
    if (!creator) {
      this.logger.error(`[redeemInviteCode] 邀请发起人不存在: creatorId=${creatorId}`);
      throw new NotFoundException('邀请发起人不存在');
    }

    this.logger.log(`[redeemInviteCode] 配对成功: userId=${userId}, creatorId=${creatorId}, bindingId=${insertedId}`);

    return {
      id: creator.id,
      bindingId: insertedId,
      userId: creator.userId,
      nickname: creator.nickname,
      avatarUrl: creator.avatarUrl,
      role: creator.role,
      city: creator.city,
      relation: myRelation,
      relationLabel: RELATION_LABELS[myRelation],
      remarkName: '',
      boundAt: boundAtIso,
      hasUnread: false,
      lastActiveAt: '',
      lastBroadcastAt: '',
      unreadReportCount: 0,
    };
  }

  async updateRemarkName(
    userId: string,
    bindingId: string,
    remarkName: string,
  ): Promise<void> {
    const rows = await this.db
      .select()
      .from(xinyuBindings)
      .where(eq(xinyuBindings.id, bindingId))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('绑定关系不存在');
    const binding = rows[0];
    if (binding.userIdA !== userId && binding.userIdB !== userId) {
      throw new NotFoundException('绑定关系不存在');
    }
    const isA = binding.userIdA === userId;
    const patch = isA
      ? { remarkNameA: remarkName || null }
      : { remarkNameB: remarkName || null };
    await this.db
      .update(xinyuBindings)
      .set(patch)
      .where(eq(xinyuBindings.id, bindingId));
  }

  async removeFamily(userId: string, bindingId: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(xinyuBindings)
      .where(eq(xinyuBindings.id, bindingId))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('绑定关系不存在');
    const binding = rows[0];
    if (binding.userIdA !== userId && binding.userIdB !== userId) {
      throw new NotFoundException('绑定关系不存在');
    }
    await this.db
      .update(xinyuBindings)
      .set({ status: 'unbound' })
      .where(eq(xinyuBindings.id, bindingId));
  }

  async getActiveInviteCode(userId: string): Promise<{ code: string; expiresAt: string; relation: FamilyRelation } | null> {
    this.logger.log(`[getActiveInviteCode] userId=${userId}`);
    const rows = await this.db
      .select()
      .from(xinyuInviteCodes)
      .where(
        and(
          eq(xinyuInviteCodes.userId, userId),
          eq(xinyuInviteCodes.status, 'active'),
        ),
      )
      .orderBy(desc(xinyuInviteCodes.createdAt))
      .limit(1);
    if (rows.length === 0) {
      this.logger.log(`[getActiveInviteCode] 无有效邀请码: userId=${userId}`);
      return null;
    }
    const invite = rows[0];
    const now = new Date();
    if (invite.expiresAt && new Date(invite.expiresAt) < now) {
      this.logger.log(`[getActiveInviteCode] 邀请码已过期: userId=${userId}, code=${invite.code}`);
      await this.db
        .update(xinyuInviteCodes)
        .set({ status: 'expired' })
        .where(eq(xinyuInviteCodes.id, invite.id));
      return null;
    }
    this.logger.log(`[getActiveInviteCode] 找到有效邀请码: userId=${userId}, code=${invite.code}`);
    return {
      code: invite.code,
      expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : '',
      relation: (invite.relation as FamilyRelation) || 'other',
    };
  }

  async getAllBoundBindings(): Promise<Array<{ id: string; userIdA: string; userIdB: string; boundAt: Date | null }>> {
    const rows = await this.db
      .select({
        id: xinyuBindings.id,
        userIdA: xinyuBindings.userIdA,
        userIdB: xinyuBindings.userIdB,
        boundAt: xinyuBindings.boundAt,
      })
      .from(xinyuBindings)
      .where(eq(xinyuBindings.status, 'bound'));
    return rows;
  }

  private async countBindings(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(xinyuBindings)
      .where(
        and(
          or(eq(xinyuBindings.userIdA, userId), eq(xinyuBindings.userIdB, userId)),
          eq(xinyuBindings.status, 'bound'),
        ),
      );
    return Number(result[0]?.count ?? 0);
  }

  private generateSixDigitCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i += 1) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private extractPostgresErrorCode(error: unknown): string | undefined {
    let current: unknown = error;
    for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
      const { code, cause } = current as { code?: unknown; cause?: unknown };
      if (typeof code === 'string') return code;
      current = cause;
    }
    return undefined;
  }
}
