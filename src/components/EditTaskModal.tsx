import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getFolders } from '../db/operations';
import type { Task } from '../types';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (id: string, changes: { text: string; priority: Task['priority']; folderId: string }) => void;
  onDelete: (id: string) => void;
}

const PRIORITIES: { value: Task['priority']; label: string; color: string }[] = [
  { value: null, label: 'Ninguna', color: '#94a3b8' },
  { value: 'low', label: 'Baja', color: '#3b82f6' },
  { value: 'mid', label: 'Media', color: '#eab308' },
  { value: 'high', label: 'Alta', color: '#ef4444' },
];

export function EditTaskModal({ task, onClose, onSave, onDelete }: EditTaskModalProps) {
  const [text, setText] = useState(task.text);
  const [priority, setPriority] = useState<Task['priority']>(task.priority);
  const [folderId, setFolderId] = useState(task.folderId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const folders = useLiveQuery(() => getFolders(), [], []);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(task.id, { text: trimmed, priority, folderId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-800">Editar tarea</h2>

        {/* Text */}
        <div>
          <label className="block text-sm text-slate-500 mb-1">Texto</label>
          <input
            autoFocus
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm text-slate-500 mb-2">Prioridad</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.label}
                onClick={() => setPriority(p.value)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: priority === p.value ? p.color + '20' : '#f1f5f9',
                  color: priority === p.value ? p.color : '#64748b',
                  border: priority === p.value ? `2px solid ${p.color}` : '2px solid transparent',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Move to folder */}
        <div>
          <label className="block text-sm text-slate-500 mb-1">Carpeta</label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-slate-600 bg-slate-100 font-medium active:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-lg text-white bg-blue-500 font-medium active:bg-blue-600 transition-colors disabled:opacity-40"
          >
            Guardar
          </button>
        </div>

        {/* Delete */}
        <div className="pt-1 border-t border-slate-100">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-500">Confirmar eliminación?</span>
              <button
                onClick={() => onDelete(task.id)}
                className="text-sm text-white bg-red-500 px-3 py-1.5 rounded-lg font-medium"
              >
                Eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-slate-500"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 py-2"
            >
              Eliminar tarea
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
