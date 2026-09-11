import { Module } from '@nestjs/common';
import { XinyuUsersController } from './xinyu-users.controller';
import { XinyuUsersService } from './xinyu-users.service';
import { XinyuRecordingsModule } from '../xinyu-recordings/xinyu-recordings.module';

@Module({
  imports: [XinyuRecordingsModule],
  controllers: [XinyuUsersController],
  providers: [XinyuUsersService],
  exports: [XinyuUsersService],
})
export class XinyuUsersModule {}
