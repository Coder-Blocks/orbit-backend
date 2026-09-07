import { Module } from '@nestjs/common';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { UploadsController } from './uploads.controller';

@Module({
  providers: [LocalDiskStorageProvider],
  controllers: [UploadsController],
  exports: [LocalDiskStorageProvider],
})
export class StorageModule {}
