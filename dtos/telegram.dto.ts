export interface SendMessageRequestDto {
  chatId: string;
  text: string;
}

export interface SendMessageResponseDto {
  success: true;
  messageId: number;
}
