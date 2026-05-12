import type { TaskDto } from "../dtos/task.dto";
import { join } from "path";

const TASKS_FILE = join(import.meta.dir, "../data/tasks.json");

async function readTasks(): Promise<TaskDto[]> {
  return await Bun.file(TASKS_FILE).json();
}

async function writeTasks(tasks: TaskDto[]): Promise<void> {
  await Bun.write(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export async function listTasks(): Promise<TaskDto[]> {
  return readTasks();
}

export async function addTask(text: string): Promise<TaskDto> {
  const tasks = await readTasks();
  const nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  const newTask: TaskDto = { id: nextId, task: text, done: false };
  tasks.push(newTask);
  await writeTasks(tasks);
  return newTask;
}

export async function checkTask(id: number): Promise<boolean> {
  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;
  task.done = true;
  await writeTasks(tasks);
  return true;
}

export async function uncheckTask(id: number): Promise<boolean> {
  const tasks = await readTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;
  task.done = false;
  await writeTasks(tasks);
  return true;
}

export async function deleteTask(id: number): Promise<boolean> {
  const tasks = await readTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  await writeTasks(tasks);
  return true;
}
