import type { WeatherResponseDto, WeatherWithForecastDto } from "../dtos/weather.dto";

interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
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
If forecast data is included, briefly mention what's coming in the next days too.
Do NOT output raw numbers or JSON — write naturally like a friend texting you.`;

export async function generateWeatherAdvice(
  data: WeatherResponseDto | WeatherWithForecastDto,
): Promise<string> {
  return callMistral(WEATHER_PROMPT, JSON.stringify(data, null, 2));
}
