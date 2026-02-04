import type { Task } from '../types';

interface ParseResult {
  text: string;
  taskGroupName: string | null;
  priority: Task['priority'];
}

/**
 * Parsea el texto de entrada buscando:
 * - "> NombreTaskGroup" → extrae nombre de grupo
 * - "low" / "mid" / "high" al final → extrae prioridad
 *
 * Ejemplos:
 *   "Comprar leche > Compras high" → { text: "Comprar leche", taskGroupName: "Compras", priority: "high" }
 *   "Llamar al banco mid" → { text: "Llamar al banco", taskGroupName: null, priority: "mid" }
 *   "Revisar correo" → { text: "Revisar correo", taskGroupName: null, priority: null }
 */
export function parseTaskInput(input: string): ParseResult {
  let text = input.trim();
  let taskGroupName: string | null = null;
  let priority: Task['priority'] = null;

  // Extract priority from end of text
  const priorityMatch = text.match(/\s+(low|mid|high)$/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase() as 'low' | 'mid' | 'high';
    text = text.slice(0, priorityMatch.index).trim();
  }

  // Extract "> TaskGroupName"
  const groupMatch = text.match(/>\s*(.+)$/);
  if (groupMatch) {
    taskGroupName = groupMatch[1].trim();
    text = text.slice(0, groupMatch.index).trim();
  }

  return { text, taskGroupName, priority };
}
