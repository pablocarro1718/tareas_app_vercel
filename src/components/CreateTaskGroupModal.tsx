import { useState } from 'react';

interface CreateTaskGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function CreateTaskGroupModal({ open, onClose, onSave }: CreateTaskGroupModalProps) {
  const [name, setName] = useState('');

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Nuevo grupo</h2>

        <div>
          <label className="block text-sm text-slate-500 mb-1">Nombre</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Urgente, Esta semana..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-slate-600 bg-slate-100 font-medium active:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg text-white bg-blue-500 font-medium active:bg-blue-600 transition-colors disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
