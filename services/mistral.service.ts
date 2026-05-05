interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const SYSTEM_PROMPT = `You are a bot assistant. Analyze the user's message:
- If it contains an insult, respond with a creative witty insult back in the EXACT same language and a similar tone. Do NOT explain yourself, just insult back.
- If it is NOT an insult, respond with exactly the single word: NOT_INSULT`;

export async function handleInsult(message: string): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) throw new Error("Mistral API error");

  const data = (await res.json()) as MistralResponse;
  const reply = data.choices[0]?.message.content.trim() ?? "NOT_INSULT";

  return reply === "NOT_INSULT" ? null : reply;
}
