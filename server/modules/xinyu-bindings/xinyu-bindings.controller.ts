import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuBindingsService } from './xinyu-bindings.service';
import type {
  FamilyMember,
  FamilyMemberDetail,
  CreateInviteCodeRequest,
  RedeemInviteCodeRequest,
} from '@shared/api.interface';

@Controller('api/xinyu/family')
export class XinyuBindingsController {
  constructor(private readonly bindingsService: XinyuBindingsService) {}

  @Get()
  async getFamilyList(@CurrentUser() user: JwtPayload): Promise<FamilyMember[]> {
    return this.bindingsService.getFamilyList(user.userId);
  }

  @Get('invite-code')
  async getActiveInviteCode(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ code: string; expiresAt: string; relation: string } | null> {
    return this.bindingsService.getActiveInviteCode(user.userId);
  }

  @Post('invite-code')
  async createInviteCode(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateInviteCodeRequest,
  ): Promise<{ code: string; expiresAt: string; relation: string }> {
    return this.bindingsService.createInviteCode(user.userId, body.relation);
  }

  @Post('redeem')
  async redeemInviteCode(
    @CurrentUser() user: JwtPayload,
    @Body() body: RedeemInviteCodeRequest,
  ): Promise<FamilyMember> {
    return this.bindingsService.redeemInviteCode(user.userId, body.code, body.relation);
  }

  @Get(':userId/detail')
  async getMemberDetail(
    @CurrentUser() user: JwtPayload,
    @Param('userId') memberUserId: string,
  ): Promise<FamilyMemberDetail> {
    return this.bindingsService.getMemberDetail(user.userId, memberUserId);
  }

  @Delete(':bindingId')
  async removeFamily(@CurrentUser() user: JwtPayload, @Param('bindingId') bindingId: string): Promise<void> {
    await this.bindingsService.removeFamily(user.userId, bindingId);
  }
}
