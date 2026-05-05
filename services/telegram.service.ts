import type { TelegramApiResponse, TelegramGetUpdatesResponse } from "../models/telegram.model";

const baseUrl = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(chatId: string | number, text: string): Promise<number> {
  const res = await fetch(`${baseUrl()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const payload = (await res.json()) as TelegramApiResponse;

  if (!payload.ok) {
    throw new Error(payload.description ?? "Telegram API error");
  }

  return payload.result.message_id;
}

export async function getUpdates(offset: number): Promise<TelegramGetUpdatesResponse> {
  const res = await fetch(`${baseUrl()}/getUpdates?offset=${offset}&timeout=0`);
  return (await res.json()) as TelegramGetUpdatesResponse;
}
