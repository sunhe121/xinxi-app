import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuDailyDataService } from './xinyu-daily-data.service';
import type { DailyData } from '@shared/api.interface';
import { XinyuUsersService } from '../xinyu-users/xinyu-users.service';

@Controller('api/xinyu/daily-data')
export class XinyuDailyDataController {
  constructor(
    private readonly dailyDataService: XinyuDailyDataService,
    private readonly usersService: XinyuUsersService,
  ) {}

  @Get('today')
  async getToday(@CurrentUser() user: JwtPayload, @Query('userId') targetUserId?: string): Promise<DailyData> {
    const queryUserId = targetUserId || user.userId;
    const userInfo = await this.usersService.findByUserId(queryUserId);
    const role = userInfo?.role ?? 'child';
    return this.dailyDataService.getTodayData(queryUserId, role);
  }

  @Get('week')
  async getWeek(@CurrentUser() user: JwtPayload, @Query('userId') targetUserId?: string): Promise<DailyData[]> {
    const queryUserId = targetUserId || user.userId;
    const userInfo = await this.usersService.findByUserId(queryUserId);
    const role = userInfo?.role ?? 'child';
    return this.dailyDataService.getWeekData(queryUserId, role);
  }
}
