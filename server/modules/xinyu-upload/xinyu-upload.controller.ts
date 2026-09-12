import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '@server/common/guards/jwt-auth.guard';
import { XinyuUploadService } from './xinyu-upload.service';
import type { UploadFileRequest, UploadFileResponse } from '@shared/api.interface';

@Controller('api/xinyu/upload')
export class XinyuUploadController {
  constructor(private readonly uploadService: XinyuUploadService) {}

  @Post()
  async uploadFile(
    @CurrentUser() _user: JwtPayload,
    @Body() body: UploadFileRequest,
  ): Promise<UploadFileResponse> {
    return this.uploadService.uploadBase64(
      body.fileName,
      body.fileBase64,
      body.type,
    );
  }
}
