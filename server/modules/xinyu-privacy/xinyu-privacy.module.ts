import { Module } from '@nestjs/common';
import { XinyuPrivacyController } from './xinyu-privacy.controller';
import { XinyuPrivacyService } from './xinyu-privacy.service';

@Module({
  controllers: [XinyuPrivacyController],
  providers: [XinyuPrivacyService],
  exports: [XinyuPrivacyService],
})
export class XinyuPrivacyModule {}
