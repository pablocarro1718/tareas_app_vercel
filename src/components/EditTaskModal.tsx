import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getFolders } from '../db/operations';
import type { Task } from '../types';

interface EditTaskModalProps {
  task: Task;
  onSave: (id: string, changes: { text: string; notes: string; priority: Task['priority']; folderId: string }) => void;
  onDelete: (id: string) => void;
}

const PRIORITIES: { value: Task['priority']; label: string; color: string }[] = [
  { value: null, label: 'Ninguna', color: '#94a3b8' },
  { value: 'low', label: 'Baja', color: '#3b82f6' },
  { value: 'mid', label: 'Media', color: '#eab308' },
  { value: 'high', label: 'Alta', color: '#ef4444' },
];

export function EditTaskModal({ task, onSave, onDelete }: EditTaskModalProps) {
  const [text, setText] = useState(task.text);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [priority, setPriority] = useState<Task['priority']>(task.priority);
  const [folderId, setFolderId] = useState(task.folderId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const folders = useLiveQuery(() => getFolders(), [], []);

  // Auto-save on close
  const saveAndClose = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(task.id, { text: trimmed, notes: notes.trim(), priority, folderId });
  };

  // Auto-resize notes textarea
  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.style.height = 'auto';
      notesRef.current.style.height = notesRef.current.scrollHeight + 'px';
    }
  }, [notes]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-14 pb-3 bg-white border-b border-slate-100">
        <button
          onClick={saveAndClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <h1 className="flex-1 text-lg font-semibold text-slate-800">Tarea</h1>

        {/* Delete button */}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-slate-500 px-2 py-1"
            >
              No
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs text-white bg-red-500 px-3 py-1.5 rounded-lg font-medium active:bg-red-600"
            >
              Confirmar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 active:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}
      </header>

      {/* Content */}
      <div className="px-4 py-5 space-y-5 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Task name */}
        <div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nombre de la tarea"
            className="w-full text-lg font-medium text-slate-800 placeholder:text-slate-300 bg-transparent border-none focus:outline-none"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Prioridad</label>
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Notas</label>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escribe notas, ideas, detalles..."
            rows={4}
            className="w-full px-3 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Folder */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Carpeta</label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
