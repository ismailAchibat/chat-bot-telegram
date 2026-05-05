import { Hono } from "hono";
import type { WeatherResponseDto } from "../dtos/weather.dto";
import type { OpenWeatherResponse } from "../models/weather.model";

const weather = new Hono();

weather.get("/", async (c) => {
  const city = c.req.query("city");

  if (!city) {
    return c.json({ error: "city query parameter is required" }, 400);
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
  );

  if (res.status === 404) {
    return c.json({ error: "City not found" }, 404);
  }

  if (!res.ok) {
    return c.json({ error: "OpenWeatherMap API error" }, 502);
  }

  const data = (await res.json()) as OpenWeatherResponse;

  const response: WeatherResponseDto = {
    city: data.name,
    country: data.sys.country,
    temperature: data.main.temp,
    feels_like: data.main.feels_like,
    humidity: data.main.humidity,
    description: data.weather[0]?.description ?? "N/A",
  };

  return c.json(response);
});

export default weather;
