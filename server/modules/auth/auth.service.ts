import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuUsers } from '@server/database/schema';
import type { ToneStyle, UserRole, XinyuUser } from '@shared/api.interface';

export interface RegisterDto {
  phone: string;
  password: string;
  nickname: string;
  code: string;
  gender?: 'male' | 'female';
  role?: UserRole;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface SendSmsCodeDto {
  phone: string;
  scene: 'register' | 'reset_password';
}

export interface ResetPasswordDto {
  phone: string;
  code: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: XinyuUser;
}

export interface SmsCodeResponse {
  code: string;
}

export interface ResetPasswordResponse {
  success: boolean;
}

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const SMS_CODE_TTL = 5 * 60 * 1000; // 5 minutes
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface SmsCodeEntry {
  code: string;
  expiresAt: number;
}

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CODE_CHARS.charAt(Math.floor(Math.random() * INVITE_CODE_CHARS.length));
  }
  return code;
}

function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly smsCodes = new Map<string, SmsCodeEntry>();

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const phone = (dto.phone || '').trim();
    const nickname = (dto.nickname || '').trim();
    const password = dto.password || '';
    const code = (dto.code || '').trim();

    if (!PHONE_REGEX.test(phone)) {
      throw new BadRequestException('请输入正确的手机号');
    }
    if (password.length < 6) {
      throw new BadRequestException('密码至少6位');
    }
    if (nickname.length < 2 || nickname.length > 20) {
      throw new BadRequestException('昵称长度需在2-20字之间');
    }
    if (!code) {
      throw new BadRequestException('请输入验证码');
    }

    this.verifySmsCode(phone, code);

    const existingByPhone = await this.db
      .select()
      .from(xinyuUsers)
      .where(eq(xinyuUsers.phone, phone))
      .limit(1);

    if (existingByPhone.length > 0) {
      throw new BadRequestException('该手机号已被注册');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let inviteCode = '';
    for (let attempt = 0; attempt < 50; attempt++) {
      inviteCode = generateInviteCode();
      const dup = await this.db
        .select({ id: xinyuUsers.id })
        .from(xinyuUsers)
        .where(eq(xinyuUsers.inviteCode, inviteCode))
        .limit(1);
      if (dup.length === 0) break;
    }

    const userId = `auth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const inserted = await this.db
      .insert(xinyuUsers)
      .values({
        userId,
        phone,
        nickname,
        passwordHash,
        inviteCode,
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
    const token = this.jwtService.sign(
      { userId: user.userId, nickname: user.nickname },
      { expiresIn: '30d' },
    );

    this.smsCodes.delete(phone);

    return { token, user };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const phone = (dto.phone || '').trim();
    const password = dto.password || '';

    if (!phone) {
      throw new BadRequestException('请输入手机号或昵称');
    }
    if (!password) {
      throw new BadRequestException('请输入密码');
    }

    let userRow: typeof xinyuUsers.$inferSelect | null = null;
    let loginBy = 'phone';

    if (PHONE_REGEX.test(phone)) {
      const rows = await this.db
        .select()
        .from(xinyuUsers)
        .where(eq(xinyuUsers.phone, phone))
        .limit(1);
      if (rows.length > 0) {
        userRow = rows[0];
      }
    }

    if (!userRow) {
      loginBy = 'nickname';
      const rows = await this.db
        .select()
        .from(xinyuUsers)
        .where(eq(xinyuUsers.nickname, phone))
        .limit(1);
      if (rows.length > 0) {
        userRow = rows[0];
      }
    }

    if (!userRow) {
      throw new BadRequestException('账号或密码错误');
    }

    const passwordHash = userRow.passwordHash;
    if (!passwordHash) {
      throw new BadRequestException('该账号未设置密码，请先注册');
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      throw new BadRequestException('账号或密码错误');
    }

    const user = this.mapRow(userRow);
    const token = this.jwtService.sign(
      { userId: user.userId, nickname: user.nickname },
      { expiresIn: '30d' },
    );

    this.logger.log(`用户登录成功: ${loginBy}=${phone}`);

    return { token, user };
  }

  async sendSmsCode(dto: SendSmsCodeDto): Promise<SmsCodeResponse> {
    const phone = (dto.phone || '').trim();
    const scene = dto.scene;

    if (!PHONE_REGEX.test(phone)) {
      throw new BadRequestException('请输入正确的手机号');
    }
    if (scene !== 'register' && scene !== 'reset_password') {
      throw new BadRequestException('无效的验证码场景');
    }

    if (scene === 'reset_password') {
      const existing = await this.db
        .select({ id: xinyuUsers.id })
        .from(xinyuUsers)
        .where(eq(xinyuUsers.phone, phone))
        .limit(1);
      if (existing.length === 0) {
        throw new BadRequestException('该手机号未注册');
      }
    }

    if (scene === 'register') {
      const existing = await this.db
        .select({ id: xinyuUsers.id })
        .from(xinyuUsers)
        .where(eq(xinyuUsers.phone, phone))
        .limit(1);
      if (existing.length > 0) {
        throw new BadRequestException('该手机号已被注册');
      }
    }

    const code = generateSmsCode();
    this.smsCodes.set(phone, {
      code,
      expiresAt: Date.now() + SMS_CODE_TTL,
    });

    this.logger.log(`发送验证码: phone=${phone}, scene=${scene}, code=${code}`);

    return { code };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    const phone = (dto.phone || '').trim();
    const code = (dto.code || '').trim();
    const newPassword = dto.newPassword || '';

    if (!PHONE_REGEX.test(phone)) {
      throw new BadRequestException('请输入正确的手机号');
    }
    if (!code) {
      throw new BadRequestException('请输入验证码');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('新密码至少6位');
    }

    this.verifySmsCode(phone, code);

    const existing = await this.db
      .select()
      .from(xinyuUsers)
      .where(eq(xinyuUsers.phone, phone))
      .limit(1);

    if (existing.length === 0) {
      throw new BadRequestException('该手机号未注册');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db
      .update(xinyuUsers)
      .set({ passwordHash })
      .where(eq(xinyuUsers.phone, phone));

    this.smsCodes.delete(phone);

    return { success: true };
  }

  private verifySmsCode(phone: string, code: string): void {
    const entry = this.smsCodes.get(phone);
    if (!entry) {
      throw new BadRequestException('请先获取验证码');
    }
    if (Date.now() > entry.expiresAt) {
      this.smsCodes.delete(phone);
      throw new BadRequestException('验证码已过期，请重新获取');
    }
    if (entry.code !== code) {
      throw new BadRequestException('验证码错误');
    }
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
