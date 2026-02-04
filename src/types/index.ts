// Carpeta (Folder)
export interface Folder {
  id: string;
  name: string;
  color: string;
  order: number;
  llmContext: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

// Task Group
export interface TaskGroup {
  id: string;
  folderId: string;
  name: string;
  order: number;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task (Subtask)
export interface Task {
  id: string;
  folderId: string;
  taskGroupId: string | null;
  text: string;
  priority: 'low' | 'mid' | 'high' | null;
  isCompleted: boolean;
  isArchived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Cola de Clasificación (para offline)
export interface PendingClassification {
  id: string;
  taskId: string;
  rawText: string;
  createdAt: string;
}

// Paleta de colores para carpetas
export const FOLDER_COLORS = [
  '#22c55e', // verde
  '#3b82f6', // azul
  '#eab308', // amarillo
  '#ef4444', // rojo
  '#8b5cf6', // violeta
  '#06b6d4', // cyan
  '#f97316', // naranja
  '#ec4899', // rosa
] as const;
