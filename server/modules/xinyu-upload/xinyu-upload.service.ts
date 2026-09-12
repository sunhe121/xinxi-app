import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import type { UploadFileResponse } from '@shared/api.interface';

type UploadType = 'image' | 'voice' | 'video';

const ALLOWED_EXT: Record<UploadType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif'],
  voice: ['mp3', 'wav', 'webm'],
  video: ['mp4', 'webm'],
};

const SIZE_LIMITS: Record<UploadType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  voice: 50 * 1024 * 1024, // 50MB
  video: 100 * 1024 * 1024, // 100MB
};

@Injectable()
export class XinyuUploadService {
  private readonly logger = new Logger(XinyuUploadService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads');

  async uploadBase64(
    fileName: string,
    fileBase64: string,
    type: UploadType,
  ): Promise<UploadFileResponse> {
    const ext = this.getValidExtension(fileName, type);
    const buffer = this.decodeBase64(fileBase64);

    if (buffer.length > SIZE_LIMITS[type]) {
      throw new BadRequestException(
        `文件大小超过限制，最大允许 ${Math.round(SIZE_LIMITS[type] / 1024 / 1024)}MB`,
      );
    }

    const dateStr = this.getDateString();
    const dateDir = join(this.uploadsDir, dateStr);
    await mkdir(dateDir, { recursive: true });

    const randomStr = randomBytes(6).toString('hex');
    const savedName = `${Date.now()}_${randomStr}.${ext}`;
    const filePath = join(dateDir, savedName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${dateStr}/${savedName}`;
    this.logger.log(`文件上传成功: ${fileUrl} (${buffer.length} bytes)`);

    return { fileUrl };
  }

  private getValidExtension(fileName: string, type: UploadType): string {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex < 0) {
      throw new BadRequestException('文件名缺少扩展名');
    }
    const ext = fileName.slice(dotIndex + 1).toLowerCase();
    const allowed = ALLOWED_EXT[type];
    if (!allowed.includes(ext)) {
      throw new BadRequestException(
        `不支持的文件类型，允许的扩展名: ${allowed.join(', ')}`,
      );
    }
    return ext;
  }

  private decodeBase64(fileBase64: string): Buffer {
    // 处理可能带 data:image/png;base64, 前缀的情况
    const cleanBase64 = fileBase64.includes(',')
      ? fileBase64.split(',')[1]
      : fileBase64;
    try {
      return Buffer.from(cleanBase64, 'base64');
    } catch {
      throw new BadRequestException('base64 解码失败');
    }
  }

  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
