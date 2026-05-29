import type { WeatherResponseDto, WeatherWithForecastDto } from "../dtos/weather.dto";
import type { TaskDto } from "../dtos/task.dto";

interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface TaskResolution {
  action: "check" | "uncheck" | "delete" | "unknown";
  taskId: number | null;
}

async function callMistral(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) throw new Error("Mistral API error");

  const data = (await res.json()) as MistralResponse;
  return data.choices[0]?.message.content.trim() ?? "";
}

const WEATHER_PROMPT = `You are a friendly weather assistant. You receive weather data as JSON.
Write a short, natural and friendly message (3-5 sentences) in French that:
1. Summarizes the weather conditions conversationally
2. Recommends what to wear based on the temperature, humidity and conditions
3. always keep the temperature in Celsius
Do NOT output raw numbers or JSON — write naturally like a friend texting you.`;

const TASK_RESOLVE_PROMPT = `You are a task manager assistant. The user sent a message about managing their tasks but didn't provide a task ID.
You will receive the user's message and their current task list as JSON.
Your job is to figure out which task the user is referring to and what action they want.

Supported actions: "check" (mark as done), "uncheck" (mark as not done), "delete" (remove the task).

Respond with ONLY a raw JSON object, no markdown, no explanation:
{"action": "check", "taskId": 2}
{"action": "delete", "taskId": 3}
{"action": "unknown", "taskId": null}`;

const RECOMMEND_PROMPT = `You are a movie and series expert. The user wants a recommendation.
Reply in French with a single recommendation in this format:
🎬 <Title> (<year>)
🎭 Genre: <genre>
⭐ <one punchy sentence on why it's worth watching>
📖 <2-3 sentence synopsis, no spoilers>

Keep it short, engaging, and conversational. Vary your picks — don't always suggest the most obvious titles.`;

export async function recommendContent(type: "film" | "série", genre?: string): Promise<string> {
  const request = genre
    ? `Recommend a ${type} in the "${genre}" genre.`
    : `Recommend any great ${type}.`;
  return callMistral(RECOMMEND_PROMPT, request);
}

export async function generateWeatherAdvice(
  data: WeatherResponseDto | WeatherWithForecastDto,
): Promise<string> {
  return callMistral(WEATHER_PROMPT, JSON.stringify(data, null, 2));
}

export async function resolveTaskCommand(
  message: string,
  tasks: TaskDto[],
): Promise<TaskResolution> {
  const userMessage = `User message: "${message}"\n\nTask list:\n${JSON.stringify(tasks, null, 2)}`;
  const raw = await callMistral(TASK_RESOLVE_PROMPT, userMessage);

  try {
    return JSON.parse(raw) as TaskResolution;
  } catch {
    return { action: "unknown", taskId: null };
  }
}
