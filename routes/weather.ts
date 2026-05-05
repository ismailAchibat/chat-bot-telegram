import { Hono } from "hono";
import { getWeather, getWeatherWithForecast, CityNotFoundError } from "../services/weather.service";

const weather = new Hono();

weather.get("/", async (c) => {
  const city = c.req.query("city");
  const forecast = c.req.query("forecast") === "true";

  if (!city) {
    return c.json({ error: "city query parameter is required" }, 400);
  }

  try {
    const data = forecast ? await getWeatherWithForecast(city) : await getWeather(city);
    return c.json(data);
  } catch (err) {
    if (err instanceof CityNotFoundError) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: "OpenWeatherMap API error" }, 502);
  }
});

export default weather;
