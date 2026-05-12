import { getUpdates, sendMessage } from "../services/telegram.service";
import { getWeather, getWeatherWithForecast, CityNotFoundError } from "../services/weather.service";
import { getRandomJoke, listJokes, addJoke, deleteJoke } from "../services/joke.service";
import { listTasks, addTask, checkTask, uncheckTask, deleteTask } from "../services/task.service";
import { generateWeatherAdvice, resolveTaskCommand, recommendContent } from "../services/mistral.service";
import { logger } from "../utils/logger";

const POLL_INTERVAL_MS = 1000;

const HELP_REGEX         = /^help$/i;
const RECOMMEND_REGEX    = /recommend\s+(film|movie|série|serie|series|show)\s*(.+)?/i;
const METEO_REGEX        = /(?:m[eé]t[eé]o|weather)\s+(.+)/i;
const FORECAST_KEYWORD   = /3\s*jours|3\s*days|forecast/i;
const JOKE_REGEX         = /histoire\s+dr[oô]le|joke/i;
const LIST_JOKES_REGEX   = /list\s+jokes/i;
const ADD_JOKE_REGEX     = /add\s+joke\s+(.+)/i;
const DELETE_JOKE_REGEX  = /delete\s+joke\s+(\d+)/i;
const LIST_TASKS_REGEX   = /list\s+tasks/i;
const ADD_TASK_REGEX     = /add\s+task\s+(.+)/i;
const CHECK_TASK_REGEX   = /check\s+task\s+(\d+)/i;
const UNCHECK_TASK_REGEX = /uncheck\s+task\s+(\d+)/i;
const DELETE_TASK_REGEX  = /delete\s+task\s+(\d+)/i;

let offset = 0;

async function reply(chatId: number, text: string): Promise<void> {
  await sendMessage(chatId, text);
  logger.out(chatId, text);
}

async function handleUpdate(chatId: number, text: string): Promise<void> {
  logger.in(chatId, text);

  // --- help ---

  if (HELP_REGEX.test(text)) {
    logger.intent("help");
    await reply(chatId,
      "Voici ce que je peux faire pour vous :\n\n" +
      "🌤 Météo\n" +
      "  météo <ville> — météo du jour\n" +
      "  météo <ville> 3 jours — météo + prévisions\n\n" +
      "😂 Blagues\n" +
      "  joke — blague aléatoire\n" +
      "  list jokes — voir toutes les blagues\n" +
      "  add joke <texte> — ajouter une blague\n" +
      "  delete joke <id> — supprimer une blague\n\n" +
      "🎬 Recommandations\n" +
      "  recommend movie — film aléatoire\n" +
      "  recommend movie <genre> — film par genre\n" +
      "  recommend serie — série aléatoire\n" +
      "  recommend serie <genre> — série par genre\n\n" +
      "✅ Tâches\n" +
      "  list tasks — voir toutes les tâches\n" +
      "  add task <texte> — ajouter une tâche\n" +
      "  check task <id> — marquer comme faite\n" +
      "  uncheck task <id> — marquer comme non faite\n" +
      "  delete task <id> — supprimer une tâche"
    );
    return;
  }

  // --- recommend ---

  const recommendMatch = RECOMMEND_REGEX.exec(text);
  if (recommendMatch) {
    const rawType = recommendMatch[1]!.toLowerCase();
    const type = (rawType === "movie" || rawType === "film") ? "film" : "série";
    const genre = recommendMatch[2]?.trim() || undefined;
    logger.intent("recommend", genre ? `${type} · ${genre}` : type);
    try {
      const msg = await recommendContent(type, genre);
      await reply(chatId, msg);
    } catch (err) {
      logger.error("recommend", err);
      await reply(chatId, "Erreur lors de la récupération de la recommandation.");
    }
    return;
  }

  // --- tasks ---

  if (LIST_TASKS_REGEX.test(text)) {
    logger.intent("list tasks");
    const tasks = await listTasks();
    if (tasks.length === 0) {
      await reply(chatId, "Aucune tâche pour le moment.");
      return;
    }
    const msg = tasks.map((t) => `${t.done ? "☑" : "☐"} [${t.id}] ${t.task}`).join("\n");
    await reply(chatId, msg);
    return;
  }

  const addTaskMatch = ADD_TASK_REGEX.exec(text);
  if (addTaskMatch) {
    const newTask = await addTask(addTaskMatch[1]!.trim());
    logger.intent("add task", newTask.task);
    await reply(chatId, `Tâche ajoutée (id: ${newTask.id}) ✅`);
    return;
  }

  const checkTaskMatch = CHECK_TASK_REGEX.exec(text);
  if (checkTaskMatch) {
    const id = parseInt(checkTaskMatch[1]!);
    logger.intent("check task", String(id));
    const found = await checkTask(id);
    await reply(chatId, found ? `Tâche ${id} marquée comme faite ☑` : `Aucune tâche trouvée avec l'id ${id}.`);
    return;
  }

  const uncheckTaskMatch = UNCHECK_TASK_REGEX.exec(text);
  if (uncheckTaskMatch) {
    const id = parseInt(uncheckTaskMatch[1]!);
    logger.intent("uncheck task", String(id));
    const found = await uncheckTask(id);
    await reply(chatId, found ? `Tâche ${id} marquée comme non faite ☐` : `Aucune tâche trouvée avec l'id ${id}.`);
    return;
  }

  const deleteTaskMatch = DELETE_TASK_REGEX.exec(text);
  if (deleteTaskMatch) {
    const id = parseInt(deleteTaskMatch[1]!);
    logger.intent("delete task", String(id));
    const deleted = await deleteTask(id);
    await reply(chatId, deleted ? `Tâche ${id} supprimée ✅` : `Aucune tâche trouvée avec l'id ${id}.`);
    return;
  }

  // --- jokes ---

  if (LIST_JOKES_REGEX.test(text)) {
    logger.intent("list jokes");
    const all = await listJokes();
    const msg = all.map((j, i) => `${i + 1}- ${j.joke}`).join("\n");
    await reply(chatId, msg);
    return;
  }

  const addJokeMatch = ADD_JOKE_REGEX.exec(text);
  if (addJokeMatch) {
    const newJoke = await addJoke(addJokeMatch[1]!.trim());
    logger.intent("add joke", newJoke.joke);
    await reply(chatId, `Blague ajoutée (id: ${newJoke.id}) ✅`);
    return;
  }

  const deleteJokeMatch = DELETE_JOKE_REGEX.exec(text);
  if (deleteJokeMatch) {
    const id = parseInt(deleteJokeMatch[1]!);
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

  // --- météo ---

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

  // --- task fuzzy fallback ---

  if (/task/i.test(text)) {
    logger.intent("task fuzzy → mistral");
    try {
      const tasks = await listTasks();
      const resolution = await resolveTaskCommand(text, tasks);

      if (resolution.action === "uncheck" && resolution.taskId !== null) {
        const found = await uncheckTask(resolution.taskId);
        await reply(chatId, found ? `Tâche ${resolution.taskId} marquée comme non faite ☐` : `Aucune tâche trouvée avec l'id ${resolution.taskId}.`);
        return;
      }

      if (resolution.action === "check" && resolution.taskId !== null) {
        const found = await checkTask(resolution.taskId);
        await reply(chatId, found ? `Tâche ${resolution.taskId} marquée comme faite ☑` : `Aucune tâche trouvée avec l'id ${resolution.taskId}.`);
        return;
      }

      if (resolution.action === "delete" && resolution.taskId !== null) {
        const deleted = await deleteTask(resolution.taskId);
        await reply(chatId, deleted ? `Tâche ${resolution.taskId} supprimée ✅` : `Aucune tâche trouvée avec l'id ${resolution.taskId}.`);
        return;
      }
    } catch (err) {
      logger.error("task fuzzy", err);
    }
  }

  // --- fallback ---

  logger.intent("unrecognized");
  await reply(chatId, "Désolé, je ne comprends pas ce message. Tapez \"help\" pour voir ce que je peux faire pour vous.");
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
