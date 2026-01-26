import { useState, useCallback, useEffect } from 'react';
import type { Task, TaskStatus, ChipSuggestion, AppSettings } from './types';
import { useTasks } from './hooks/useTasks';
import { useBlocks } from './hooks/useBlocks';
import { useSettings } from './hooks/useSettings';
import { ChatInput } from './components/capture';
import { TaskList, TaskEditor, SearchBar } from './components/tasks';
import { SettingsPanel } from './components/settings';
import { getAllTasks, clearAllTasks, bulkUpsertTasks } from './db/database';

function App() {
  const { tasks, createTask, updateTask, deleteTask, dismissTask, setTaskStatus, searchTasks } = useTasks();
  const { allBlockPaths } = useBlocks(tasks);
  const { settings, updateSettings } = useSettings();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter tasks based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      searchTasks(searchQuery).then(results => {
        setFilteredTasks(results);
      });
    } else {
      setIsSearching(false);
      setFilteredTasks([]);
    }
  }, [searchQuery, searchTasks]);

  // Get task groups to display (filtered or all)
  const { taskGroups: displayGroups } = useBlocks(isSearching ? filteredTasks : tasks);

  // Handlers
  const handleCreateTask = async (text: string, suggestions: ChipSuggestion[]) => {
    await createTask(text, suggestions);
  };

  const handleTaskStatusChange = async (id: string, status: TaskStatus) => {
    await setTaskStatus(id, status);
  };

  const handleTaskDismiss = async (id: string) => {
    await dismissTask(id);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditorOpen(true);
  };

  const handleTaskSave = async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    setSelectedTask(null);
  };

  const handleTaskDelete = async (id: string) => {
    await deleteTask(id);
    setSelectedTask(null);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Wrapper to match expected type signature
  const handleUpdateSettings = async (updates: Partial<AppSettings>): Promise<void> => {
    await updateSettings(updates);
  };

  // Data management
  const handleClearData = async () => {
    await clearAllTasks();
  };

  const handleExportData = async () => {
    const tasks = await getAllTasks();
    const data = JSON.stringify({ tasks, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tareas-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.tasks && Array.isArray(data.tasks)) {
            await bulkUpsertTasks(data.tasks);
            alert(`Importadas ${data.tasks.length} tareas`);
          }
        } catch (err) {
          alert('Error al importar: archivo no válido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h1 className="text-xl font-bold">Tareas</h1>

        <div className="flex items-center gap-2">
          <SearchBar onSearch={handleSearch} />

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            aria-label="Ajustes"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Search indicator */}
      {isSearching && (
        <div className="px-4 py-2 bg-blue-900/30 border-b border-blue-800/50">
          <p className="text-sm text-blue-300">
            Buscando: "{searchQuery}" ({filteredTasks.length} resultado{filteredTasks.length !== 1 ? 's' : ''})
          </p>
        </div>
      )}

      {/* Task List */}
      <TaskList
        taskGroups={displayGroups}
        onTaskStatusChange={handleTaskStatusChange}
        onTaskDismiss={handleTaskDismiss}
        onTaskClick={handleTaskClick}
        emptyMessage={
          isSearching
            ? 'No se encontraron tareas'
            : 'No hay tareas. ¡Escribe algo abajo para empezar!'
        }
      />

      {/* Chat Input */}
      <ChatInput onSubmit={handleCreateTask} />

      {/* Task Editor */}
      <TaskEditor
        task={selectedTask}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        allBlockPaths={allBlockPaths}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearData={handleClearData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
    </div>
  );
}

export default App;
