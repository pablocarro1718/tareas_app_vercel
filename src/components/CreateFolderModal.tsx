import { useState } from 'react';
import { FOLDER_COLORS } from '../types';

interface CreateFolderModalProps {
  open: boolean;
  defaultColorIndex: number;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

export function CreateFolderModal({
  open,
  defaultColorIndex,
  onClose,
  onSave,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    FOLDER_COLORS[defaultColorIndex % FOLDER_COLORS.length]
  );

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, selectedColor);
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Nueva carpeta</h2>

        {/* Name input */}
        <div>
          <label className="block text-sm text-slate-500 mb-1">Nombre</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Trabajo, Personal..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm text-slate-500 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {FOLDER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-8 h-8 rounded-full transition-transform"
                style={{
                  backgroundColor: color,
                  transform: selectedColor === color ? 'scale(1.2)' : 'scale(1)',
                  boxShadow:
                    selectedColor === color
                      ? `0 0 0 2px white, 0 0 0 4px ${color}`
                      : 'none',
                }}
              />
            ))}
          </div>
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
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-40"
            style={{ backgroundColor: selectedColor }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
