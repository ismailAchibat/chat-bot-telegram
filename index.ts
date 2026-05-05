import { Hono } from "hono";
import telegram from "./routes/telegram";
import weather from "./routes/weather";
import joke from "./routes/joke";

const app = new Hono();

app.route("/telegram", telegram);
app.route("/weather", weather);
app.route("/joke", joke);

export default {
  port: 3000,
  fetch: app.fetch,
};
