import { getUpdates, sendMessage } from "../services/telegram.service";
import { getWeather, CityNotFoundError } from "../services/weather.service";
import { getRandomJoke } from "../services/joke.service";

const POLL_INTERVAL_MS = 5000;
const METEO_REGEX = /m[eé]t[eé]o\s+(.+)/i;
const JOKE_REGEX = /histoire\s+dr[oô]le|joke/i;

let offset = 0;

async function handleUpdate(chatId: number, text: string): Promise<void> {
  if (JOKE_REGEX.test(text)) {
    const { joke } = getRandomJoke();
    await sendMessage(chatId, joke);
    return;
  }

  const meteoMatch = METEO_REGEX.exec(text);
  if (meteoMatch) {
    const city = meteoMatch[1]!.trim();
    try {
      const weather = await getWeather(city);
      const reply =
        `Météo à ${weather.city}, ${weather.country}:\n` +
        `🌡️ Température: ${weather.temperature}°C (ressenti ${weather.feels_like}°C)\n` +
        `💧 Humidité: ${weather.humidity}%\n` +
        `☁️ ${weather.description}`;
      await sendMessage(chatId, reply);
    } catch (err) {
      if (err instanceof CityNotFoundError) {
        await sendMessage(chatId, `Ville introuvable : "${city}"`);
      } else {
        await sendMessage(chatId, "Erreur lors de la récupération de la météo.");
      }
    }
    return;
  }

  await sendMessage(chatId, "Désolé, je ne comprends pas ce message. Essayez : \"météo Paris\" ou \"histoire drôle\".");
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
