import { Hono } from "hono";
import { getRandomJoke } from "../services/joke.service";

const joke = new Hono();

joke.get("/", (c) => {
  return c.json(getRandomJoke());
});

export default joke;
