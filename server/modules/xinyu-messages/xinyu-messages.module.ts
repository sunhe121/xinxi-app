import { Module } from '@nestjs/common';
import { XinyuMessagesController } from './xinyu-messages.controller';
import { XinyuMessagesService } from './xinyu-messages.service';
import { XinyuBindingsModule } from '../xinyu-bindings/xinyu-bindings.module';

@Module({
  imports: [XinyuBindingsModule],
  controllers: [XinyuMessagesController],
  providers: [XinyuMessagesService],
  exports: [XinyuMessagesService],
})
export class XinyuMessagesModule {}
