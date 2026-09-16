import { Module } from '@nestjs/common';
import { XinyuBroadcastsController } from './xinyu-broadcasts.controller';
import { XinyuBroadcastsService } from './xinyu-broadcasts.service';
import { XinyuBroadcastSchedulerService } from './xinyu-broadcast-scheduler.service';
import { AiModule } from '../ai/ai.module';
import { XinyuDailyDataModule } from '../xinyu-daily-data/xinyu-daily-data.module';
import { XinyuWeatherModule } from '../xinyu-weather/xinyu-weather.module';
import { XinyuUsersModule } from '../xinyu-users/xinyu-users.module';
import { XinyuBindingsModule } from '../xinyu-bindings/xinyu-bindings.module';

@Module({
  imports: [AiModule, XinyuDailyDataModule, XinyuWeatherModule, XinyuUsersModule, XinyuBindingsModule],
  controllers: [XinyuBroadcastsController],
  providers: [XinyuBroadcastsService, XinyuBroadcastSchedulerService],
  exports: [XinyuBroadcastsService],
})
export class XinyuBroadcastsModule {}
