import { useState } from 'react';
import { FOLDER_COLORS } from '../types';
import type { Folder } from '../types';

interface EditFolderModalProps {
  folder: Folder;
  onClose: () => void;
  onSave: (changes: { name: string; color: string; llmContext: string; keywords: string[] }) => void;
  onDelete: () => void;
}

export function EditFolderModal({ folder, onClose, onSave, onDelete }: EditFolderModalProps) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color);
  const [llmContext, setLlmContext] = useState(folder.llmContext);
  const [keywords, setKeywords] = useState<string[]>(folder.keywords);
  const [keywordInput, setKeywordInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, color, llmContext, keywords });
  };

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative rounded-2xl w-full max-w-sm p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: '#1c1c1e', animation: 'modal-enter 200ms ease-out' }}
      >
        <h2 className="text-lg font-semibold text-white">Configurar carpeta</h2>

        {/* Name */}
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ backgroundColor: '#2c2c2e', borderColor: '#3f3f46' }}
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: color === c ? `0 0 0 2px #1c1c1e, 0 0 0 4px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* LLM Context */}
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Contexto para clasificación
          </label>
          <textarea
            value={llmContext}
            onChange={(e) => setLlmContext(e.target.value)}
            rows={3}
            placeholder="Describe qué tipo de tareas van en esta carpeta..."
            className="w-full px-3 py-2.5 rounded-lg border text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ backgroundColor: '#2c2c2e', borderColor: '#3f3f46' }}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Ayuda al clasificador automático a saber qué tareas poner aquí
          </p>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Palabras clave</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              placeholder="Añadir palabra clave..."
              className="flex-1 px-3 py-2 rounded-lg border text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: '#2c2c2e', borderColor: '#3f3f46' }}
            />
            <button
              onClick={addKeyword}
              disabled={!keywordInput.trim()}
              className="px-3 py-2 rounded-lg text-zinc-400 text-sm font-medium active:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: '#2c2c2e' }}
            >
              Añadir
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: color + '20', color }}
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
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
            style={{ backgroundColor: color }}
          >
            Guardar
          </button>
        </div>

        {/* Delete */}
        <div className="pt-1" style={{ borderTop: '1px solid #27272a' }}>
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-500">Eliminar carpeta y todo su contenido?</span>
              <button
                onClick={onDelete}
                className="text-sm text-white bg-red-500 px-3 py-1.5 rounded-lg font-medium"
              >
                Eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-zinc-400"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 py-2"
            >
              Eliminar carpeta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
