import { Hono } from "hono";
import { listTasks, addTask, checkTask, uncheckTask, deleteTask } from "../services/task.service";

const task = new Hono();

task.get("/", async (c) => {
  const tasks = await listTasks();
  return c.json(tasks);
});

task.post("/", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!text) return c.json({ error: "text is required" }, 400);
  const newTask = await addTask(text);
  return c.json(newTask, 201);
});

task.patch("/:id/check", async (c) => {
  const id = parseInt(c.req.param("id"));
  const found = await checkTask(id);
  if (!found) return c.json({ error: `Task ${id} not found` }, 404);
  return c.json({ success: true });
});

task.patch("/:id/uncheck", async (c) => {
  const id = parseInt(c.req.param("id"));
  const found = await uncheckTask(id);
  if (!found) return c.json({ error: `Task ${id} not found` }, 404);
  return c.json({ success: true });
});

task.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const deleted = await deleteTask(id);
  if (!deleted) return c.json({ error: `Task ${id} not found` }, 404);
  return c.json({ success: true });
});

export default task;
