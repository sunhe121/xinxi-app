import { Controller, Get, Render } from '@nestjs/common';
import { Public } from '@server/common/guards/jwt-auth.guard';

@Controller()
@Public()
export class ViewController {
  @Get(['/', '*'])
  @Render('index')
  async render(): Promise<Record<string, never>> {
    return {};
  }
}
