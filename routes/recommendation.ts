import { Hono } from "hono";
import { recommendContent } from "../services/mistral.service";

const recommendation = new Hono();

recommendation.get("/", async (c) => {
  const rawType = c.req.query("type");
  const genre = c.req.query("genre");

  if (!rawType) return c.json({ error: "type query parameter is required (movie or serie)" }, 400);

  const normalized = rawType.toLowerCase();
  if (normalized !== "movie" && normalized !== "serie" && normalized !== "film" && normalized !== "series") {
    return c.json({ error: "type must be one of: movie, serie" }, 400);
  }

  const type = (normalized === "movie" || normalized === "film") ? "film" : "série";

  try {
    const result = await recommendContent(type, genre ?? undefined);
    return c.json({ type, genre: genre ?? null, recommendation: result });
  } catch {
    return c.json({ error: "Erreur lors de la génération de la recommandation" }, 502);
  }
});

export default recommendation;
