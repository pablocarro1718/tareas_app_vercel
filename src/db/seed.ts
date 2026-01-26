import { v4 as uuid } from 'uuid';
import type { Task } from '../types';
import { db, createTask } from './database';

/**
 * Sample tasks for demonstration
 */
const SEED_TASKS: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    rawText: 'responder correo alba constitución instachef',
    title: 'responder correo alba constitución instachef',
    blockPath: ['Instachef', 'Constitución'],
    status: 'todo',
    tags: ['email'],
  },
  {
    rawText: 'acabar doc plan mex 2026',
    title: 'acabar doc plan mex 2026',
    blockPath: ['Instachef', 'Documentación'],
    status: 'doing',
  },
  {
    rawText: 'intro Marta EBISU <> Omme',
    title: 'intro Marta EBISU <> Omme',
    blockPath: ['EBISU'],
    status: 'todo',
    tags: ['intro'],
  },
  {
    rawText: 'Acabar 221 recetas Instachef',
    title: 'Acabar 221 recetas Instachef',
    blockPath: ['Instachef', 'Recetas'],
    status: 'doing',
    subTasks: [
      { id: uuid(), text: 'Revisar recetas 1-50', done: true },
      { id: uuid(), text: 'Revisar recetas 51-100', done: true },
      { id: uuid(), text: 'Revisar recetas 101-150', done: false },
      { id: uuid(), text: 'Revisar recetas 151-221', done: false },
    ]
  },
  {
    rawText: 'Lista coinversores',
    title: 'Lista coinversores',
    blockPath: ['Instachef', 'Inversores'],
    status: 'todo',
  },
  {
    rawText: 'Revisar contrato proveedor',
    title: 'Revisar contrato proveedor',
    blockPath: ['Omme'],
    status: 'todo',
  },
  {
    rawText: 'Llamar a Carlos sobre inversión',
    title: 'Llamar a Carlos sobre inversión',
    blockPath: ['Antai', 'Inversores'],
    status: 'todo',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
  },
  {
    rawText: 'Preparar presentación OC',
    title: 'Preparar presentación Opportunity Circle',
    blockPath: ['Opportunity Circle'],
    status: 'todo',
  },
  {
    rawText: 'Actualizar docs legales SHA',
    title: 'Actualizar docs legales SHA',
    blockPath: ['Instachef', 'Constitución', 'Documentación'],
    status: 'done',
  },
  {
    rawText: 'Reunión equipo producto',
    title: 'Reunión equipo producto',
    blockPath: ['Instachef', 'Producto'],
    status: 'done',
  },
  {
    rawText: 'Comprar dominio nuevo',
    title: 'Comprar dominio nuevo',
    blockPath: [],
    status: 'todo',
  },
  {
    rawText: 'Revisar métricas mensuales',
    title: 'Revisar métricas mensuales',
    blockPath: ['Antai Admin'],
    status: 'todo',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // Next week
  },
];

/**
 * Seed the database with sample tasks
 */
export async function seedDatabase(): Promise<void> {
  // Check if already seeded
  const existingTasks = await db.tasks.count();
  if (existingTasks > 0) {
    console.log('Database already has tasks, skipping seed');
    return;
  }

  console.log('Seeding database with sample tasks...');

  const now = new Date();
  for (let i = 0; i < SEED_TASKS.length; i++) {
    const seedTask = SEED_TASKS[i];
    const createdAt = new Date(now.getTime() - (SEED_TASKS.length - i) * 60000).toISOString();

    const task: Task = {
      id: uuid(),
      ...seedTask,
      createdAt,
      updatedAt: createdAt,
    };

    await createTask(task);
  }

  console.log(`Seeded ${SEED_TASKS.length} tasks`);
}

/**
 * Clear and reseed the database
 */
export async function reseedDatabase(): Promise<void> {
  await db.tasks.clear();
  await db.parsingResults.clear();
  await seedDatabase();
}
