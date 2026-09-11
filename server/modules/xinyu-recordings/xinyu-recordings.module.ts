import { Module } from '@nestjs/common';
import { XinyuRecordingsController } from './xinyu-recordings.controller';
import { XinyuRecordingsService } from './xinyu-recordings.service';

@Module({
  controllers: [XinyuRecordingsController],
  providers: [XinyuRecordingsService],
  exports: [XinyuRecordingsService],
})
export class XinyuRecordingsModule {}
