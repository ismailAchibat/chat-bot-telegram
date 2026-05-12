import type { JokeDto } from "../dtos/joke.dto";
import { join } from "path";

const JOKES_FILE = join(import.meta.dir, "../data/jokes.json");

async function readJokes(): Promise<JokeDto[]> {
  return await Bun.file(JOKES_FILE).json();
}

async function writeJokes(jokes: JokeDto[]): Promise<void> {
  await Bun.write(JOKES_FILE, JSON.stringify(jokes, null, 2));
}

export async function getRandomJoke(): Promise<JokeDto> {
  const jokes = await readJokes();
  return jokes[Math.floor(Math.random() * jokes.length)] as JokeDto;
}

export async function listJokes(): Promise<JokeDto[]> {
  return readJokes();
}

export async function addJoke(text: string): Promise<JokeDto> {
  const jokes = await readJokes();
  const nextId = jokes.reduce((max, j) => Math.max(max, j.id), 0) + 1;
  const newJoke: JokeDto = { id: nextId, joke: text };
  jokes.push(newJoke);
  await writeJokes(jokes);
  return newJoke;
}

export async function deleteJoke(id: number): Promise<boolean> {
  const jokes = await readJokes();
  const index = jokes.findIndex((j) => j.id === id);
  if (index === -1) return false;
  jokes.splice(index, 1);
  await writeJokes(jokes);
  return true;
}
