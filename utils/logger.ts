const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
};

function timestamp(): string {
  return `${c.dim}${new Date().toLocaleTimeString("fr-FR")}${c.reset}`;
}

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export const logger = {
  in(chatId: number, text: string): void {
    console.log(
      `${timestamp()} ${c.cyan}${c.bold}◀ IN ${c.reset}${c.dim}[chat:${chatId}]${c.reset} ${c.cyan}"${truncate(text)}"${c.reset}`,
    );
  },

  out(chatId: number, text: string): void {
    console.log(
      `${timestamp()} ${c.green}${c.bold}▶ OUT${c.reset}${c.dim}[chat:${chatId}]${c.reset} ${c.green}"${truncate(text)}"${c.reset}`,
    );
  },

  intent(label: string, detail?: string): void {
    const extra = detail ? ` ${c.dim}→ ${detail}${c.reset}` : "";
    console.log(
      `${timestamp()} ${c.yellow}  ⚡ ${label}${c.reset}${extra}`,
    );
  },

  error(context: string, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(
      `${timestamp()} ${c.red}${c.bold}  ✖ ${context}${c.reset} ${c.red}${msg}${c.reset}`,
    );
  },

  boot(msg: string): void {
    console.log(
      `\n${c.magenta}${c.bold}  🤖 ${msg}${c.reset}\n`,
    );
  },
};
