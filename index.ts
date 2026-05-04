import { Hono } from "hono";

const app = new Hono();

app.get("/hello", (c) => c.json({ message: "Hello, World!" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
