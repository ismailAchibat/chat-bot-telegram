import { getUpdates, sendMessage } from "../services/telegram.service";
import { getWeather, getWeatherWithForecast, CityNotFoundError } from "../services/weather.service";
import { getRandomJoke } from "../services/joke.service";
import type { ForecastDayDto } from "../dtos/weather.dto";

const POLL_INTERVAL_MS = 5000;
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

async function handleUpdate(chatId: number, text: string): Promise<void> {
  if (JOKE_REGEX.test(text)) {
    const { joke } = getRandomJoke();
    await sendMessage(chatId, joke);
    return;
  }

  const meteoMatch = METEO_REGEX.exec(text);
  if (meteoMatch) {
    const rawCity = meteoMatch[1]!.trim();
    const wantsForecast = FORECAST_KEYWORD.test(rawCity);
    const city = rawCity.replace(FORECAST_KEYWORD, "").trim();

    try {
      if (wantsForecast) {
        const data = await getWeatherWithForecast(city);
        const reply =
          `Météo à ${data.city}, ${data.country}:\n` +
          `🌡️ Aujourd'hui: ${data.temperature}°C (ressenti ${data.feels_like}°C)\n` +
          `💧 Humidité: ${data.humidity}% · ${data.description}\n\n` +
          `Prévisions:\n` +
          data.forecast.map(formatForecastDay).join("\n\n");
        await sendMessage(chatId, reply);
      } else {
        const data = await getWeather(city);
        const reply =
          `Météo à ${data.city}, ${data.country}:\n` +
          `🌡️ Température: ${data.temperature}°C (ressenti ${data.feels_like}°C)\n` +
          `💧 Humidité: ${data.humidity}%\n` +
          `☁️ ${data.description}`;
        await sendMessage(chatId, reply);
      }
    } catch (err) {
      if (err instanceof CityNotFoundError) {
        await sendMessage(chatId, `Ville introuvable : "${city}"`);
      } else {
        await sendMessage(chatId, "Erreur lors de la récupération de la météo.");
      }
    }
    return;
  }

  await sendMessage(chatId, "Désolé, je ne comprends pas ce message. Essayez : \"météo Paris\", \"météo Paris 3 jours\" ou \"histoire drôle\".");
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
  } catch {
    // network hiccup — will retry next tick
  }
}

export function startPolling(): void {
  console.log(`Bot polling started (every ${POLL_INTERVAL_MS / 1000}s)`);
  setInterval(poll, POLL_INTERVAL_MS);
}
