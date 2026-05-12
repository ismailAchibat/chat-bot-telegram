import { getUpdates, sendMessage } from "../services/telegram.service";
import { getWeather, getWeatherWithForecast, CityNotFoundError } from "../services/weather.service";
import { getRandomJoke, listJokes, addJoke, deleteJoke } from "../services/joke.service";
import { generateWeatherAdvice } from "../services/mistral.service";
import { logger } from "../utils/logger";

const POLL_INTERVAL_MS = 1000;
const METEO_REGEX = /(?:m[eé]t[eé]o|weather)\s+(.+)/i;
const FORECAST_KEYWORD = /3\s*jours|3\s*days|forecast/i;
const JOKE_REGEX = /histoire\s+dr[oô]le|joke/i;
const LIST_JOKES_REGEX = /list\s+jokes/i;
const ADD_JOKE_REGEX = /add\s+joke\s+(.+)/i;
const DELETE_JOKE_REGEX = /delete\s+joke\s+(\d+)/i;

let offset = 0;

async function reply(chatId: number, text: string): Promise<void> {
  await sendMessage(chatId, text);
  logger.out(chatId, text);
}

async function handleUpdate(chatId: number, text: string): Promise<void> {
  logger.in(chatId, text);

  if (LIST_JOKES_REGEX.test(text)) {
    logger.intent("list jokes");
    const all = await listJokes();
    const msg = all.map((j, i) => `${i + 1}- ${j.joke}`).join("\n");
    await reply(chatId, msg);
    return;
  }

  const addMatch = ADD_JOKE_REGEX.exec(text);
  if (addMatch) {
    const newJoke = await addJoke(addMatch[1]!.trim());
    logger.intent("add joke", newJoke.joke);
    await reply(chatId, `Blague ajoutée (id: ${newJoke.id}) ✅`);
    return;
  }

  const deleteMatch = DELETE_JOKE_REGEX.exec(text);
  if (deleteMatch) {
    const id = parseInt(deleteMatch[1]!);
    logger.intent("delete joke", String(id));
    const deleted = await deleteJoke(id);
    await reply(chatId, deleted ? `Blague ${id} supprimée ✅` : `Aucune blague trouvée avec l'id ${id}.`);
    return;
  }

  if (JOKE_REGEX.test(text)) {
    logger.intent("joke");
    const { joke } = await getRandomJoke();
    await reply(chatId, joke);
    return;
  }

  const meteoMatch = METEO_REGEX.exec(text);
  if (meteoMatch) {
    const rawCity = meteoMatch[1]!.trim();
    const wantsForecast = FORECAST_KEYWORD.test(rawCity);
    const city = rawCity.replace(FORECAST_KEYWORD, "").trim();

    logger.intent(wantsForecast ? "météo+forecast" : "météo", city);

    try {
      const data = wantsForecast
        ? await getWeatherWithForecast(city)
        : await getWeather(city);

      logger.intent("mistral → weather advice");
      const msg = await generateWeatherAdvice(data);
      await reply(chatId, msg);
    } catch (err) {
      logger.error("weather", err);
      if (err instanceof CityNotFoundError) {
        await reply(chatId, `Ville introuvable : "${city}"`);
      } else {
        await reply(chatId, "Erreur lors de la récupération de la météo.");
      }
    }
    return;
  }

  logger.intent("unrecognized");
  await reply(chatId, "Désolé, je ne comprends pas ce message. Essayez : \"météo Paris\", \"météo Paris 3 jours\" ou \"histoire drôle\".");
}

async function poll(): Promise<void> {
  try {
    const { result } = await getUpdates(offset);

    for (const update of result) {
      const message = update.message;
      if (!message?.text) {
        offset = update.update_id + 1;
        continue;
      }
      await handleUpdate(message.chat.id, message.text);
      offset = update.update_id + 1;
    }
  } catch (err) {
    logger.error("poll", err);
  }
}

async function loop(): Promise<void> {
  await poll();
  setTimeout(loop, POLL_INTERVAL_MS);
}

export function startPolling(): void {
  logger.boot(`Bot polling started (every ${POLL_INTERVAL_MS / 1000}s)`);
  loop();
}
