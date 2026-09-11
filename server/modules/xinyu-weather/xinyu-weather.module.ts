import { Module } from '@nestjs/common';
import { XinyuWeatherController } from './xinyu-weather.controller';
import { XinyuWeatherService } from './xinyu-weather.service';

@Module({
  controllers: [XinyuWeatherController],
  providers: [XinyuWeatherService],
  exports: [XinyuWeatherService],
})
export class XinyuWeatherModule {}
