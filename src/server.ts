import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';

const app = express();
const PORT = 3000;

const DATA_FILE = path.resolve(__dirname, 'tasks.json');

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

let tasks: Task[] = [];
let saving = false;
let savePending = false;

async function loadTasks() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    tasks = JSON.parse(data);
  } catch {
    tasks = [];
  }
}

async function saveTasksToFile() {
  if (saving) {
    savePending = true;
    return;
  }
  saving = true;
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error('Ошибка при записи tasks.json', err);
  } finally {
    saving = false;
    if (savePending) {
      savePending = false;
      saveTasksToFile();
    }
  }
}

app.use(cors());
app.use(express.json());

app.get('/api/tasks', (req: Request, res: Response) => {
  res.json(tasks);
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  const { title, completed } = req.body;
  const newTask: Task = { id: uuidv4(), title, completed: !!completed };
  tasks.push(newTask);
  await saveTasksToFile();
  res.status(201).json(newTask);
});

app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  Object.assign(task, req.body);
  await saveTasksToFile();
  return res.json(task);
});

app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  tasks = tasks.filter(t => t.id !== id);
  await saveTasksToFile();
  res.status(204).send();
});

(async () => {
  await loadTasks();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
