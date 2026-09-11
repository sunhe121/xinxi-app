import { Module } from '@nestjs/common';
import { XinyuDailyDataController } from './xinyu-daily-data.controller';
import { XinyuDailyDataService } from './xinyu-daily-data.service';
import { XinyuUsersModule } from '../xinyu-users/xinyu-users.module';

@Module({
  imports: [XinyuUsersModule],
  controllers: [XinyuDailyDataController],
  providers: [XinyuDailyDataService],
  exports: [XinyuDailyDataService],
})
export class XinyuDailyDataModule {}
