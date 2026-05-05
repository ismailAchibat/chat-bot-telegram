export interface WeatherResponseDto {
  city: string;
  country: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  description: string;
}

export interface ForecastDayDto {
  date: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  description: string;
}

export interface WeatherWithForecastDto extends WeatherResponseDto {
  forecast: ForecastDayDto[];
}
