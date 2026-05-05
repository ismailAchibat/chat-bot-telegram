import { getUpdates, sendMessage } from "../services/telegram.service";
import { getWeather, getWeatherWithForecast, CityNotFoundError } from "../services/weather.service";
import { getRandomJoke } from "../services/joke.service";
import { handleInsult } from "../services/mistral.service";
import { logger } from "../utils/logger";
import type { ForecastDayDto } from "../dtos/weather.dto";

const POLL_INTERVAL_MS = 500;
const METEO_REGEX = /(?:m[eé]t[eé]o|weather)\s+(.+)/i;
const FORECAST_KEYWORD = /3\s*jours|3\s*days|forecast/i;
const JOKE_REGEX = /histoire\s+dr[oô]le|joke/i;

let offset = 0;

function formatForecastDay(day: ForecastDayDto): string {
  return (
    `📅 ${day.date}\n` +
    `  🌡️ ${day.temperature}°C (ressenti ${day.feels_like}°C)\n` +
    `  💧 ${day.humidity}% · ${day.description}`
  );
}

async function reply(chatId: number, text: string): Promise<void> {
  await sendMessage(chatId, text);
  logger.out(chatId, text);
}

async function handleUpdate(chatId: number, text: string): Promise<void> {
  logger.in(chatId, text);

  if (JOKE_REGEX.test(text)) {
    logger.intent("joke");
    const { joke } = getRandomJoke();
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
      if (wantsForecast) {
        const data = await getWeatherWithForecast(city);
        const msg =
          `Météo à ${data.city}, ${data.country}:\n` +
          `🌡️ Aujourd'hui: ${data.temperature}°C (ressenti ${data.feels_like}°C)\n` +
          `💧 Humidité: ${data.humidity}% · ${data.description}\n\n` +
          `Prévisions:\n` +
          data.forecast.map(formatForecastDay).join("\n\n");
        await reply(chatId, msg);
      } else {
        const data = await getWeather(city);
        const msg =
          `Météo à ${data.city}, ${data.country}:\n` +
          `🌡️ Température: ${data.temperature}°C (ressenti ${data.feels_like}°C)\n` +
          `💧 Humidité: ${data.humidity}%\n` +
          `☁️ ${data.description}`;
        await reply(chatId, msg);
      }
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

  logger.intent("unrecognized → mistral");
  try {
    const insultReply = await handleInsult(text);
    if (insultReply) {
      logger.intent("insult detected");
      await reply(chatId, insultReply);
    } else {
      await reply(chatId, "Désolé, je ne comprends pas ce message. Essayez : \"météo Paris\", \"météo Paris 3 jours\" ou \"histoire drôle\".");
    }
  } catch (err) {
    logger.error("mistral", err);
    await reply(chatId, "Désolé, je ne comprends pas ce message. Essayez : \"météo Paris\", \"météo Paris 3 jours\" ou \"histoire drôle\".");
  }
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
