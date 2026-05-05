import { Hono } from "hono";
import type { SendMessageRequestDto, SendMessageResponseDto } from "../dtos/telegram.dto";
import type { TelegramApiResponse } from "../models/telegram.model";

const telegram = new Hono();

telegram.post("/message", async (c) => {
  const { chatId, text } = await c.req.json<SendMessageRequestDto>();

  if (!chatId || !text) {
    return c.json({ error: "chatId and text are required" }, 400);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const payload = (await res.json()) as TelegramApiResponse;

  if (!payload.ok) {
    return c.json({ error: payload.description ?? "Telegram API error" }, 502);
  }

  const response: SendMessageResponseDto = {
    success: true,
    messageId: payload.result.message_id,
  };

  return c.json(response);
});

export default telegram;
