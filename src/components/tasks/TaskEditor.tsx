import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import type { Task, TaskStatus, SubTask } from '../../types';
import { Drawer } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';

interface TaskEditorProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  allBlockPaths: string[][];
}

export function TaskEditor({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  allBlockPaths
}: TaskEditorProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [blockPath, setBlockPath] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setStatus(task.status);
      setBlockPath(task.blockPath);
      setDueDate(task.dueDate || '');
      setNotes(task.notes || '');
      setSubTasks(task.subTasks || []);
      setIsBlocked(task.blocked?.isBlocked || false);
      setBlockedReason(task.blocked?.reason || '');
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;

    onSave(task.id, {
      title,
      status,
      blockPath,
      dueDate: dueDate || null,
      notes: notes || undefined,
      subTasks: subTasks.length > 0 ? subTasks : undefined,
      blocked: isBlocked ? { isBlocked: true, reason: blockedReason } : undefined
    });

    onClose();
  };

  const handleDelete = () => {
    if (!task) return;

    if (confirm('¿Eliminar esta tarea permanentemente?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const addSubTask = () => {
    if (!newSubTask.trim()) return;

    setSubTasks([...subTasks, {
      id: uuid(),
      text: newSubTask.trim(),
      done: false
    }]);
    setNewSubTask('');
  };

  const toggleSubTask = (id: string) => {
    setSubTasks(subTasks.map(st =>
      st.id === id ? { ...st, done: !st.done } : st
    ));
  };

  const removeSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  const selectBlockPath = (path: string[]) => {
    setBlockPath(path);
    setShowBlockPicker(false);
  };

  if (!task) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Editar tarea">
      <div className="space-y-6">
        {/* Original text (read-only) */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Texto original</label>
          <p className="text-slate-400 text-sm italic bg-slate-900/50 p-2 rounded">
            {task.rawText}
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2
              border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Estado
          </label>
          <div className="flex gap-2">
            {(['todo', 'doing', 'done'] as TaskStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${status === s
                    ? s === 'todo' ? 'bg-slate-600 text-white'
                      : s === 'doing' ? 'bg-yellow-600 text-white'
                      : 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
              >
                {s === 'todo' ? 'Pendiente' : s === 'doing' ? 'En progreso' : 'Completada'}
              </button>
            ))}
          </div>
        </div>

        {/* Block path */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Bloque
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {blockPath.length > 0 ? (
              <>
                {blockPath.map((segment, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="text-slate-500">/</span>}
                    <Chip label={segment} type="block" size="sm" />
                  </React.Fragment>
                ))}
                <button
                  onClick={() => setBlockPath([])}
                  className="text-xs text-slate-500 hover:text-red-400"
                >
                  Quitar
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowBlockPicker(true)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + Asignar bloque
              </button>
            )}
          </div>

          {/* Block picker */}
          {showBlockPicker && (
            <div className="mt-2 p-3 bg-slate-900 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {allBlockPaths.map((path, index) => (
                  <button
                    key={index}
                    onClick={() => selectBlockPath(path)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 text-sm text-slate-300"
                  >
                    {path.join(' / ')}
                  </button>
                ))}
                {allBlockPaths.length === 0 && (
                  <p className="text-sm text-slate-500 p-2">No hay bloques disponibles</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Due date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Fecha límite
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2
              border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              outline-none"
          />
        </div>

        {/* Blocked status */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isBlocked}
              onChange={(e) => setIsBlocked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-300">
              Tarea bloqueada
            </span>
          </label>

          {isBlocked && (
            <input
              type="text"
              value={blockedReason}
              onChange={(e) => setBlockedReason(e.target.value)}
              placeholder="Motivo del bloqueo..."
              className="w-full mt-2 bg-slate-700 text-white rounded-lg px-3 py-2
                border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                outline-none text-sm"
            />
          )}
        </div>

        {/* Sub-tasks */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Subtareas
          </label>

          {subTasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {subTasks.map(st => (
                <div key={st.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => toggleSubTask(st.id)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500"
                  />
                  <span className={`flex-1 text-sm ${st.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                    {st.text}
                  </span>
                  <button
                    onClick={() => removeSubTask(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubTask();
                }
              }}
              placeholder="Nueva subtarea..."
              className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2
                border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                outline-none text-sm"
            />
            <Button onClick={addSubTask} size="sm" variant="secondary">
              Añadir
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Añade notas adicionales..."
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2
              border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button onClick={handleSave} className="flex-1">
            Guardar
          </Button>
          <Button onClick={handleDelete} variant="danger">
            Eliminar
          </Button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>Creada: {new Date(task.createdAt).toLocaleString('es-ES')}</p>
          <p>Actualizada: {new Date(task.updatedAt).toLocaleString('es-ES')}</p>
        </div>
      </div>
    </Drawer>
  );
}
