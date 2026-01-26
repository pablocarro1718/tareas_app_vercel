import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import type { Task, TaskStatus, ParsingResult, ChipSuggestion } from '../types';
import {
  db,
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  searchTasks as dbSearchTasks,
  saveParsingResult as dbSaveParsingResult,
  getParsingResult as dbGetParsingResult
} from '../db/database';
import { parseTaskInput, createParsingResult } from '../services/parser';
import { createLLMParsingResult } from '../services/parser/llm';
import { useSettings } from './useSettings';

/**
 * Hook for managing tasks
 */
export function useTasks() {
  const { settings } = useSettings();

  // Live query for all non-dismissed tasks
  const tasks = useLiveQuery(
    () => db.tasks.filter(t => !t.dismissed).toArray(),
    [],
    []
  );

  // Live query for dismissed tasks
  const dismissedTasks = useLiveQuery(
    () => db.tasks.filter(t => t.dismissed === true).toArray(),
    [],
    []
  );

  // Create a new task from raw input
  const createTask = useCallback(async (
    rawText: string,
    appliedSuggestions?: ChipSuggestion[]
  ): Promise<Task> => {
    const now = new Date().toISOString();
    const taskId = uuid();

    // Parse the input
    const parsed = parseTaskInput(rawText);

    // Determine block path from suggestions or parsing
    let blockPath: string[] = [];
    let dueDate: string | null = null;

    if (appliedSuggestions && appliedSuggestions.length > 0) {
      // Use applied suggestions
      const blockSuggestions = appliedSuggestions.filter(s => s.type === 'block');
      blockPath = blockSuggestions.map(s => s.value);

      const dateSuggestion = appliedSuggestions.find(s => s.type === 'date');
      if (dateSuggestion) {
        dueDate = dateSuggestion.value;
      }
    } else {
      // Use parsed values
      blockPath = parsed.blockPath;
      dueDate = parsed.dueDate;
    }

    const task: Task = {
      id: taskId,
      rawText,
      title: rawText, // Default title is raw text
      blockPath,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      dueDate,
      tags: [],
      dismissed: false
    };

    await dbCreateTask(task);

    // Save parsing result (for reference/debugging)
    let parsingResult: ParsingResult;
    if (settings?.llmEnabled && settings?.llmApiKey) {
      parsingResult = await createLLMParsingResult(taskId, rawText, settings.llmApiKey);
    } else {
      parsingResult = createParsingResult(taskId, rawText);
    }
    await dbSaveParsingResult(parsingResult);

    return task;
  }, [settings?.llmEnabled, settings?.llmApiKey]);

  // Update a task
  const updateTask = useCallback(async (
    id: string,
    updates: Partial<Task>
  ): Promise<void> => {
    await dbUpdateTask(id, updates);
  }, []);

  // Delete a task permanently
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await dbDeleteTask(id);
  }, []);

  // Dismiss a task (soft delete)
  const dismissTask = useCallback(async (id: string): Promise<void> => {
    await dbUpdateTask(id, { dismissed: true });
  }, []);

  // Restore a dismissed task
  const restoreTask = useCallback(async (id: string): Promise<void> => {
    await dbUpdateTask(id, { dismissed: false });
  }, []);

  // Change task status
  const setTaskStatus = useCallback(async (
    id: string,
    status: TaskStatus
  ): Promise<void> => {
    await dbUpdateTask(id, { status });
  }, []);

  // Update task block path
  const setTaskBlockPath = useCallback(async (
    id: string,
    blockPath: string[]
  ): Promise<void> => {
    await dbUpdateTask(id, { blockPath });
  }, []);

  // Search tasks
  const searchTasks = useCallback(async (query: string): Promise<Task[]> => {
    if (!query.trim()) {
      return tasks || [];
    }
    return dbSearchTasks(query);
  }, [tasks]);

  // Get parsing result for a task
  const getParsingResult = useCallback(async (
    taskId: string
  ): Promise<ParsingResult | undefined> => {
    return dbGetParsingResult(taskId);
  }, []);

  // Get suggestions for a new task input
  const getSuggestions = useCallback((text: string): ChipSuggestion[] => {
    const parsed = parseTaskInput(text);
    return parsed.suggestions;
  }, []);

  return {
    tasks: tasks || [],
    dismissedTasks: dismissedTasks || [],
    createTask,
    updateTask,
    deleteTask,
    dismissTask,
    restoreTask,
    setTaskStatus,
    setTaskBlockPath,
    searchTasks,
    getParsingResult,
    getSuggestions
  };
}

/**
 * Hook for a single task
 */
export function useTask(taskId: string | null) {
  const task = useLiveQuery(
    () => taskId ? db.tasks.get(taskId) : undefined,
    [taskId],
    undefined
  );

  const parsingResult = useLiveQuery(
    () => taskId ? db.parsingResults.where('taskId').equals(taskId).first() : undefined,
    [taskId],
    undefined
  );

  return {
    task,
    parsingResult
  };
}
