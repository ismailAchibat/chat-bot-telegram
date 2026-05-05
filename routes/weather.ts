import { Hono } from "hono";
import { getWeather, CityNotFoundError } from "../services/weather.service";

const weather = new Hono();

weather.get("/", async (c) => {
  const city = c.req.query("city");

  if (!city) {
    return c.json({ error: "city query parameter is required" }, 400);
  }

  try {
    const data = await getWeather(city);
    return c.json(data);
  } catch (err) {
    if (err instanceof CityNotFoundError) {
      return c.json({ error: err.message }, 404);
    }
    return c.json({ error: "OpenWeatherMap API error" }, 502);
  }
});

export default weather;
