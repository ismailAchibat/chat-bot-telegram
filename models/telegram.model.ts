export interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
  date: number;
  from?: { id: number; first_name: string };
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
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

export interface TelegramGetUpdatesResponse {
  ok: boolean;
  result: TelegramUpdate[];
}

export type TelegramApiResponse = TelegramApiSuccess | TelegramApiError;
