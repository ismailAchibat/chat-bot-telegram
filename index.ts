import { Hono } from "hono";
import telegram from "./routes/telegram";
import weather from "./routes/weather";
import joke from "./routes/joke";
import { startPolling } from "./bot/polling";

const app = new Hono();

app.route("/telegram", telegram);
app.route("/weather", weather);
app.route("/joke", joke);

startPolling();

export default {
  port: 3000,
  fetch: app.fetch,
};
