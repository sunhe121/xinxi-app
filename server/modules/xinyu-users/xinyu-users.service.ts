import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuUsers } from '@server/database/schema';
import { eq } from 'drizzle-orm';
import type { ToneStyle, UserRole, XinyuUser } from '@shared/api.interface';
import { XinyuRecordingsService } from '../xinyu-recordings/xinyu-recordings.service';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class XinyuUsersService {
  private readonly logger = new Logger(XinyuUsersService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly recordingsService: XinyuRecordingsService,
  ) {}

  async findByUserId(userId: string): Promise<XinyuUser | null> {
    const rows = await this.db
      .select()
      .from(xinyuUsers)
      .where(eq(xinyuUsers.userId, userId))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async create(
    userId: string,
    nickname: string,
    avatarUrl?: string,
    extras?: {
      gender?: 'male' | 'female';
      toneStyle?: ToneStyle;
      partnerNickname?: string;
      myPartnerTitle?: string;
      myTitle?: string;
      bio?: string;
    },
  ): Promise<XinyuUser> {
    let code = '';
    for (let attempt = 0; attempt < 50; attempt++) {
      code = generateInviteCode();
      const existing = await this.db
        .select({ id: xinyuUsers.id })
        .from(xinyuUsers)
        .where(eq(xinyuUsers.inviteCode, code))
        .limit(1);
      if (existing.length === 0) break;
    }
    const values: typeof xinyuUsers.$inferInsert = {
      userId,
      role: 'child',
      nickname,
      inviteCode: code,
      avatarUrl: avatarUrl || undefined,
    };
    if (extras?.gender) values.gender = extras.gender;
    if (extras?.toneStyle) values.toneStyle = extras.toneStyle;
    if (extras?.partnerNickname) values.partnerNickname = extras.partnerNickname;
    if (extras?.myPartnerTitle) values.myPartnerTitle = extras.myPartnerTitle;
    if (extras?.myTitle) values.myTitle = extras.myTitle;
    if (extras?.bio) values.bio = extras.bio;

    const inserted = await this.db
      .insert(xinyuUsers)
      .values(values)
      .returning();
    const user = this.mapRow(inserted[0]);
    await this.recordingsService.initPresetRecordings(userId);
    return user;
  }

  async update(
    userId: string,
    data: Partial<
      Pick<
        XinyuUser,
        | 'nickname'
        | 'city'
        | 'pushTime'
        | 'voiceType'
        | 'playbackSpeed'
        | 'avatarUrl'
        | 'role'
        | 'toneStyle'
        | 'partnerNickname'
        | 'myPartnerTitle'
        | 'myTitle'
         | 'bio'
         | 'gender'
         | 'phone'
         | 'languageProfile'
       >
     >,
  ): Promise<XinyuUser> {
    const patch: Record<string, unknown> = {};
    if (data.nickname !== undefined) patch.nickname = data.nickname;
    if (data.city !== undefined) patch.city = data.city;
    if (data.pushTime !== undefined) patch.pushTime = data.pushTime;
    if (data.voiceType !== undefined) patch.voiceType = data.voiceType;
    if (data.playbackSpeed !== undefined) patch.playbackSpeed = String(data.playbackSpeed);
    if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
    if (data.role !== undefined) patch.role = data.role;
    if (data.toneStyle !== undefined) patch.toneStyle = data.toneStyle;
    if (data.partnerNickname !== undefined) patch.partnerNickname = data.partnerNickname;
    if (data.myPartnerTitle !== undefined) patch.myPartnerTitle = data.myPartnerTitle;
    if (data.myTitle !== undefined) patch.myTitle = data.myTitle;
    if (data.bio !== undefined) patch.bio = data.bio;
    if (data.gender !== undefined) patch.gender = data.gender;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.languageProfile !== undefined) patch.languageProfile = data.languageProfile;
    if (Object.keys(patch).length === 0) {
      const user = await this.findByUserId(userId);
      if (!user) throw new NotFoundException('用户不存在');
      return user;
    }
    const updated = await this.db
      .update(xinyuUsers)
      .set(patch)
      .where(eq(xinyuUsers.userId, userId))
      .returning();
    if (updated.length === 0) throw new NotFoundException('用户不存在');
    return this.mapRow(updated[0]);
  }

  async findByInviteCode(inviteCode: string): Promise<XinyuUser | null> {
    const rows = await this.db
      .select()
      .from(xinyuUsers)
      .where(eq(xinyuUsers.inviteCode, inviteCode.toUpperCase()))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  private mapRow(row: typeof xinyuUsers.$inferSelect): XinyuUser {
    return {
      id: row.id,
      userId: row.userId,
      nickname: row.nickname,
      avatarUrl: row.avatarUrl ?? '',
      role: row.role as UserRole,
      inviteCode: row.inviteCode,
      city: row.city ?? '北京',
      pushTime: row.pushTime ?? '08:00,20:00',
      voiceType: row.voiceType ?? 'female_warm',
      playbackSpeed: Number(row.playbackSpeed ?? 1.0),
      toneStyle: row.toneStyle as XinyuUser['toneStyle'],
      partnerNickname: row.partnerNickname ?? '',
      myPartnerTitle: row.myPartnerTitle ?? '',
      myTitle: row.myTitle ?? '',
      bio: row.bio ?? '',
      gender: row.gender as 'male' | 'female',
      phone: row.phone ?? undefined,
      languageProfile: row.languageProfile ?? undefined,
    };
  }
}
