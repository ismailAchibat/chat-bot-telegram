import { Hono } from "hono";
import type { JokeDto } from "../dtos/joke.dto";

const jokes: JokeDto[] = [
  { id: 1, joke: "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ? Parce que sinon ils tomberaient dans le bateau." },
  { id: 2, joke: "Un homme entre dans une bibliothèque et demande un livre sur le paradoxe. La bibliothécaire répond : désolé, on n'en a plus, on vient juste d'en recevoir." },
  { id: 3, joke: "C'est l'histoire d'une bretelle qui rencontre une autre bretelle... Passons." },
  { id: 4, joke: "Qu'est-ce qu'un crocodile qui surveille les autres crocodiles ? Un vigil'ante." },
  { id: 5, joke: "Pourquoi les informaticiens confondent-ils Halloween et Noël ? Parce que OCT 31 == DEC 25." },
];

const joke = new Hono();

joke.get("/", (c) => {
  const random = jokes[Math.floor(Math.random() * jokes.length)] as JokeDto;
  return c.json(random);
});

export default joke;
