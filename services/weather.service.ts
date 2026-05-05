import type { WeatherResponseDto } from "../dtos/weather.dto";
import type { OpenWeatherResponse } from "../models/weather.model";

export async function getWeather(city: string): Promise<WeatherResponseDto> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
  );

  if (res.status === 404) {
    throw new CityNotFoundError(city);
  }

  if (!res.ok) {
    throw new Error("OpenWeatherMap API error");
  }

  const data = (await res.json()) as OpenWeatherResponse;

  return {
    city: data.name,
    country: data.sys.country,
    temperature: data.main.temp,
    feels_like: data.main.feels_like,
    humidity: data.main.humidity,
    description: data.weather[0]?.description ?? "N/A",
  };
}

export class CityNotFoundError extends Error {
  constructor(city: string) {
    super(`City not found: ${city}`);
  }
}
