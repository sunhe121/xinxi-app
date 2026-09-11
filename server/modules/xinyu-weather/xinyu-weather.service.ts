import { Injectable } from '@nestjs/common';
import type { WeatherInfo } from '@shared/api.interface';

const WEATHER_TYPES = ['晴', '多云', '阴', '小雨', '雷阵雨'];
const AIR_QUALITIES = [
  { label: '优', level: 'good' as const },
  { label: '良', level: 'moderate' as const },
  { label: '轻度污染', level: 'unhealthy-sensitive' as const },
];
const WIND_LEVELS = ['1-3级', '3-4级', '4-5级'];

const CITY_BASE_TEMPS: Record<string, number> = {
  北京: 18,
  上海: 22,
  广州: 26,
  深圳: 27,
  杭州: 20,
  成都: 19,
  武汉: 21,
  南京: 20,
  西安: 17,
  重庆: 22,
  天津: 17,
  苏州: 21,
  长沙: 22,
  青岛: 16,
  大连: 14,
  厦门: 24,
  昆明: 18,
  哈尔滨: 8,
  沈阳: 12,
  济南: 18,
};

@Injectable()
export class XinyuWeatherService {
  getWeather(city: string): WeatherInfo {
    const baseTemp = CITY_BASE_TEMPS[city] ?? 20;
    const month = new Date().getMonth();
    const seasonalAdjust = Math.cos(((month - 1) / 12) * Math.PI * 2) * -8;
    const avgTemp = Math.round(baseTemp + seasonalAdjust + (Math.random() - 0.5) * 6);
    const tempHigh = avgTemp + Math.floor(Math.random() * 5) + 3;
    const tempLow = avgTemp - Math.floor(Math.random() * 5) - 2;
    const weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    const airQuality = AIR_QUALITIES[Math.floor(Math.random() * AIR_QUALITIES.length)];
    const wind = WIND_LEVELS[Math.floor(Math.random() * WIND_LEVELS.length)];
    const humidity = Math.floor(40 + Math.random() * 40);
    const weatherIcon = this.getWeatherIcon(weather);

    return {
      city,
      temperature: avgTemp,
      tempHigh,
      tempLow,
      weather,
      weatherIcon,
      airQuality: airQuality.label,
      airQualityLevel: airQuality.level,
      wind,
      humidity,
    };
  }

  private getWeatherIcon(weather: string): string {
    const iconMap: Record<string, string> = {
      晴: 'sunny',
      多云: 'cloudy',
      阴: 'overcast',
      小雨: 'rainy',
      雷阵雨: 'thunderstorm',
    };
    return iconMap[weather] ?? 'sunny';
  }
}
