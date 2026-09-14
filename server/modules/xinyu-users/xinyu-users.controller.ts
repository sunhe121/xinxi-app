import { Body, Controller, Get, NotFoundException, Patch, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuUsersService } from './xinyu-users.service';
import type { InitUserRequest, XinyuUser } from '@shared/api.interface';

@Controller('api/xinyu/users')
export class XinyuUsersController {
  constructor(private readonly usersService: XinyuUsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload): Promise<XinyuUser | null> {
    return this.usersService.findByUserId(user.userId);
  }

  @Post('init')
  async initUser(@CurrentUser() user: JwtPayload, @Body() body: InitUserRequest): Promise<XinyuUser> {
    const existing = await this.usersService.findByUserId(user.userId);
    if (existing) return existing;
    return this.usersService.create(user.userId, body.nickname || '用户', body.avatarUrl, {
      gender: body.gender,
      toneStyle: body.toneStyle,
      partnerNickname: body.partnerNickname,
      myPartnerTitle: body.myPartnerTitle,
      myTitle: body.myTitle,
      bio: body.bio,
    });
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: Partial<
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
    const existing = await this.usersService.findByUserId(user.userId);
    if (!existing) throw new NotFoundException('用户不存在');
    return this.usersService.update(user.userId, body);
  }
}
