import { Hono } from "hono";
import { getRandomJoke } from "../services/joke.service";

const joke = new Hono();

joke.get("/", async (c) => {
  return c.json(await getRandomJoke());
});

export default joke;
