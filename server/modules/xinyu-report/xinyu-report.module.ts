import { Module } from '@nestjs/common';
import { XinyuReportService } from './xinyu-report.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [XinyuReportService],
  exports: [XinyuReportService],
})
export class XinyuReportModule {}
