// Task status types
export type TaskStatus = 'todo' | 'doing' | 'done';

// Task type classifications
export type TaskType = 'email' | 'intro' | 'doc' | 'research' | 'call' | 'meeting' | 'review' | 'other';

// Subtask within a task
export interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

// Blocked status for a task
export interface BlockedStatus {
  isBlocked: boolean;
  reason?: string;
  waitingOn?: string;
}

// Main Task entity
export interface Task {
  id: string;
  rawText: string; // Immutable original input
  title: string; // Default = rawText, editable
  blockPath: string[]; // Hierarchical path, e.g. ["Instachef", "Constitución"]
  status: TaskStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  dueDate?: string | null; // ISO string
  tags?: string[];
  subTasks?: SubTask[];
  blocked?: BlockedStatus;
  dismissed?: boolean;
  notes?: string;
  links?: string[];
}

// Parsing result stored separately from task
export interface ParsingResult {
  id: string;
  taskId: string;
  inferredBlockPath?: string[];
  inferredEntities?: string[];
  inferredTaskType?: TaskType;
  inferredDueDate?: string;
  confidence: number; // 0-1
  source: 'rules' | 'llm';
  createdAt: string;
}

// Block representation (derived from tasks, not stored separately)
export interface Block {
  pathId: string; // e.g. "Instachef/Constitución/SHA"
  name: string;
  path: string[];
  taskCount: number;
  children: Block[];
}

// Settings for the app
export interface AppSettings {
  llmEnabled: boolean;
  llmApiKey?: string;
  syncEnabled: boolean;
  syncToken?: string;
  encryptionPassphrase?: string;
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
}

// Sync provider interface
export interface SyncProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  push(tasks: Task[]): Promise<void>;
  pull(): Promise<Task[]>;
  getLastSyncTime(): Promise<string | null>;
}

// LLM extraction result
export interface LLMExtractionResult {
  blockPath: string[];
  entities: string[];
  taskType: TaskType;
  dueDate?: string;
  confidence: number;
}

// Chip suggestion for UI
export interface ChipSuggestion {
  type: 'block' | 'entity' | 'taskType' | 'date';
  value: string;
  label: string;
  confidence: number;
}

// Task filter options
export interface TaskFilter {
  status?: TaskStatus[];
  blockPath?: string[];
  search?: string;
  showDismissed?: boolean;
  dueBefore?: string;
  dueAfter?: string;
}

// Grouped tasks by block for display
export interface TaskGroup {
  block: Block;
  tasks: Task[];
  subGroups: TaskGroup[];
}
