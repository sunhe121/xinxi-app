import { Module } from '@nestjs/common';
import { XinyuUploadController } from './xinyu-upload.controller';
import { XinyuUploadService } from './xinyu-upload.service';

@Module({
  controllers: [XinyuUploadController],
  providers: [XinyuUploadService],
  exports: [XinyuUploadService],
})
export class XinyuUploadModule {}
