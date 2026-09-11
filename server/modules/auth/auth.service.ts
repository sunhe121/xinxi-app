import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuUsers } from '@server/database/schema';
import type { XinyuUser, UserRole, ToneStyle } from '@shared/api.interface';

export interface RegisterDto {
  nickname: string;
  password: string;
  gender?: 'male' | 'female';
  role?: UserRole;
}

export interface LoginDto {
  nickname: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: XinyuUser;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (!dto.nickname || dto.nickname.trim().length < 2) {
      throw new BadRequestException('昵称至少2个字符');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('密码至少6位');
    }

    const existing = await this.db
      .select()
      .from(xinyuUsers)
      .where(eq(xinyuUsers.nickname, dto.nickname.trim()))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException('该昵称已被注册');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let code = '';
    for (let attempt = 0; attempt < 50; attempt++) {
      code = generateInviteCode();
      const dup = await this.db
        .select({ id: xinyuUsers.id })
        .from(xinyuUsers)
        .where(eq(xinyuUsers.inviteCode, code))
        .limit(1);
      if (dup.length === 0) break;
    }

    const userId = `auth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const inserted = await this.db
      .insert(xinyuUsers)
      .values({
        userId,
        nickname: dto.nickname.trim(),
        passwordHash,
        inviteCode: code,
        gender: dto.gender || 'female',
        role: dto.role || 'child',
        avatarUrl: '',
        city: '北京',
        pushTime: '08:00,20:00',
        voiceType: 'female_warm',
        playbackSpeed: '1.0',
        toneStyle: 'warm_chatter' as ToneStyle,
        bio: '',
      })
      .returning();

    const user = this.mapRow(inserted[0]);
    const token = this.jwtService.sign({ userId: user.userId, nickname: user.nickname });

    return { token, user };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const rows = await this.db
      .select()
      .from(xinyuUsers)
      .where(eq(xinyuUsers.nickname, dto.nickname.trim()))
      .limit(1);

    if (rows.length === 0) {
      throw new BadRequestException('昵称或密码错误');
    }

    const userRow = rows[0];
    const passwordHash = userRow.passwordHash;

    if (!passwordHash) {
      throw new BadRequestException('该账号未设置密码，请先注册');
    }

    const valid = await bcrypt.compare(dto.password, passwordHash);
    if (!valid) {
      throw new BadRequestException('昵称或密码错误');
    }

    const user = this.mapRow(userRow);
    const token = this.jwtService.sign({ userId: user.userId, nickname: user.nickname });

    return { token, user };
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
    };
  }
}
