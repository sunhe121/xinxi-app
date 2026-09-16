import { Module } from '@nestjs/common';
import { RlsBootstrapService } from './rls-bootstrap.service';

@Module({
  providers: [RlsBootstrapService],
})
export class RlsBootstrapModule {}
