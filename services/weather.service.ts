import type { WeatherResponseDto, ForecastDayDto, WeatherWithForecastDto } from "../dtos/weather.dto";
import type { OpenWeatherResponse, OpenWeatherForecastResponse } from "../models/weather.model";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

export class CityNotFoundError extends Error {
  constructor(city: string) {
    super(`City not found: ${city}`);
  }
}

export async function getWeather(city: string): Promise<WeatherResponseDto> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const res = await fetch(
    `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
  );

  if (res.status === 404) throw new CityNotFoundError(city);
  if (!res.ok) throw new Error("OpenWeatherMap API error");

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

export async function getWeatherWithForecast(city: string): Promise<WeatherWithForecastDto> {
  const [today, forecastData] = await Promise.all([
    getWeather(city),
    fetchForecast(city),
  ]);

  return { ...today, forecast: forecastData };
}

async function fetchForecast(city: string): Promise<ForecastDayDto[]> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const res = await fetch(
    `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
  );

  if (res.status === 404) throw new CityNotFoundError(city);
  if (!res.ok) throw new Error("OpenWeatherMap API error");

  const data = (await res.json()) as OpenWeatherForecastResponse;

  // Group entries by date (YYYY-MM-DD), pick the one closest to noon
  const byDay = new Map<string, (typeof data.list)[number]>();

  for (const entry of data.list) {
    const [date, time] = entry.dt_txt.split(" ") as [string, string];
    const existing = byDay.get(date);
    if (!existing || Math.abs(parseInt(time) - 120000) < Math.abs(parseInt(existing.dt_txt.split(" ")[1]!) - 120000)) {
      byDay.set(date, entry);
    }
  }

  // Skip today (index 0), take the next 2 days
  return [...byDay.values()]
    .slice(1, 3)
    .map((entry) => ({
      date: entry.dt_txt.split(" ")[0] as string,
      temperature: entry.main.temp,
      feels_like: entry.main.feels_like,
      humidity: entry.main.humidity,
      description: entry.weather[0]?.description ?? "N/A",
    }));
}
