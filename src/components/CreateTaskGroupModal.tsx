import { useState } from 'react';

interface CreateTaskGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  accentColor?: string;
}

export function CreateTaskGroupModal({ open, onClose, onSave, accentColor }: CreateTaskGroupModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative rounded-2xl w-full max-w-sm p-6 space-y-5"
        style={{ backgroundColor: '#1c1c1e', animation: 'modal-enter 200ms ease-out' }}
      >
        <h2 className="text-lg font-semibold text-white">Nuevo grupo</h2>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Urgente, Esta semana..."
            className="w-full px-3 py-2.5 rounded-lg border text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ backgroundColor: '#2c2c2e', borderColor: '#3f3f46' }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-zinc-400 font-medium active:opacity-80 transition-colors"
            style={{ backgroundColor: '#2c2c2e' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-40"
            style={{ backgroundColor: accentColor || '#3b82f6' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
