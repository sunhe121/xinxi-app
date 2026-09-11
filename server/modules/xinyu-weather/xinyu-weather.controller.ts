import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '@server/common/guards/jwt-auth.guard';
import { XinyuWeatherService } from './xinyu-weather.service';
import type { WeatherInfo } from '@shared/api.interface';

@Controller('api/xinyu/weather')
@Public()
export class XinyuWeatherController {
  constructor(private readonly weatherService: XinyuWeatherService) {}

  @Get()
  getWeather(@Query('city') city?: string): WeatherInfo {
    return this.weatherService.getWeather(city || '北京');
  }
}
