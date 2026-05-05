export interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text: string;
  date: number;
}

export interface TelegramApiSuccess {
  ok: true;
  result: TelegramMessage;
}

export interface TelegramApiError {
  ok: false;
  error_code: number;
  description: string;
}

export type TelegramApiResponse = TelegramApiSuccess | TelegramApiError;
