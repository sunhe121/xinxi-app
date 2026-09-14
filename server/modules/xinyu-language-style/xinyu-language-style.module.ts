import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { XinyuLanguageStyleController } from './xinyu-language-style.controller';
import { XinyuLanguageStyleService } from './xinyu-language-style.service';

@Module({
  imports: [ConfigModule],
  controllers: [XinyuLanguageStyleController],
  providers: [XinyuLanguageStyleService],
  exports: [XinyuLanguageStyleService],
})
export class XinyuLanguageStyleModule {}
