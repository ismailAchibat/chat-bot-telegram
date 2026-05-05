import { Hono } from "hono";
import { sendMessage } from "../services/telegram.service";
import type { SendMessageRequestDto, SendMessageResponseDto } from "../dtos/telegram.dto";

const telegram = new Hono();

telegram.post("/message", async (c) => {
  const { chatId, text } = await c.req.json<SendMessageRequestDto>();

  if (!chatId || !text) {
    return c.json({ error: "chatId and text are required" }, 400);
  }

  try {
    const messageId = await sendMessage(chatId, text);
    const response: SendMessageResponseDto = { success: true, messageId };
    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Telegram API error";
    return c.json({ error: message }, 502);
  }
});

export default telegram;
