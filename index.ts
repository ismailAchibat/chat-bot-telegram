import { Hono } from "hono";
import telegram from "./routes/telegram";
import weather from "./routes/weather";
import joke from "./routes/joke";
import task from "./routes/task";
import recommendation from "./routes/recommendation";
import { startPolling } from "./bot/polling";

const app = new Hono();

app.route("/telegram", telegram);
app.route("/weather", weather);
app.route("/joke", joke);
app.route("/tasks", task);
app.route("/recommend", recommendation);

startPolling();

export default {
  port: 3000,
  fetch: app.fetch,
};
