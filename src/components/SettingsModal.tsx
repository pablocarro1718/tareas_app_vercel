import { useState } from 'react';
import { getApiKey, setApiKey } from '../services/apiKey';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [key, setKey] = useState(getApiKey);

  if (!open) return null;

  const handleSave = () => {
    setApiKey(key.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Configuración</h2>

        <div>
          <label className="block text-sm text-slate-500 mb-1">
            API Key de Anthropic
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">
            Necesaria para clasificar tareas automáticamente. Sin API key, las tareas irán a la primera carpeta.
          </p>
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
            className="flex-1 py-2.5 rounded-lg text-white bg-blue-500 font-medium active:bg-blue-600 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
