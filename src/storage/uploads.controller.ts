import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private storage: LocalDiskStorageProvider) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_SIZE_BYTES } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG or WEBP images are accepted');
    }
    return this.storage.upload(file.buffer, file.originalname, file.mimetype);
  }
}
