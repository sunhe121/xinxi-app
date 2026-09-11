import { Module } from '@nestjs/common';
import { XinyuBindingsController } from './xinyu-bindings.controller';
import { XinyuBindingsService } from './xinyu-bindings.service';
import { XinyuUsersModule } from '../xinyu-users/xinyu-users.module';
import { XinyuDailyDataModule } from '../xinyu-daily-data/xinyu-daily-data.module';

@Module({
  imports: [XinyuUsersModule, XinyuDailyDataModule],
  controllers: [XinyuBindingsController],
  providers: [XinyuBindingsService],
  exports: [XinyuBindingsService],
})
export class XinyuBindingsModule {}
