import { useState } from 'react';
import type { AppSettings } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onUpdateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  onClearData: () => Promise<void>;
  onExportData: () => Promise<void>;
  onImportData: () => Promise<void>;
}

export function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearData,
  onExportData,
  onImportData
}: SettingsPanelProps) {
  const [syncToken, setSyncToken] = useState(settings?.syncToken || '');
  const [encryptionPassphrase, setEncryptionPassphrase] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');

  if (!settings) return null;

  const handleToggleLLM = async () => {
    await onUpdateSettings({ llmEnabled: !settings.llmEnabled });
  };

  const handleToggleSync = async () => {
    await onUpdateSettings({ syncEnabled: !settings.syncEnabled });
  };

  const handleSaveSyncSettings = async () => {
    await onUpdateSettings({
      syncToken,
      encryptionPassphrase: encryptionPassphrase || undefined
    });
  };

  const handleSaveLLMSettings = async () => {
    await onUpdateSettings({ llmApiKey: llmApiKey || undefined });
  };

  const handleClearData = async () => {
    if (confirm('¿Estás seguro? Se borrarán todas las tareas permanentemente.')) {
      await onClearData();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajustes" size="md">
      <div className="space-y-6">
        {/* LLM Settings */}
        <section>
          <h3 className="text-lg font-medium text-white mb-3">
            Clasificación con IA
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            Usa un modelo de lenguaje para mejorar la clasificación automática de tareas.
            Desactivado por defecto.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.llmEnabled}
                onChange={handleToggleLLM}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                Activar clasificación con IA
              </span>
            </label>

            {settings.llmEnabled && (
              <div className="ml-8 space-y-2">
                <input
                  type="password"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  placeholder="API Key (opcional)"
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2
                    border border-slate-600 focus:border-blue-500
                    outline-none text-sm"
                />
                <Button onClick={handleSaveLLMSettings} size="sm" variant="secondary">
                  Guardar API Key
                </Button>
                <p className="text-xs text-slate-500">
                  La API key se guarda localmente y nunca sale de tu dispositivo.
                </p>
              </div>
            )}
          </div>
        </section>

        <hr className="border-slate-700" />

        {/* Sync Settings */}
        <section>
          <h3 className="text-lg font-medium text-white mb-3">
            Sincronización
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            Sincroniza tus tareas con un servidor remoto (próximamente).
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.syncEnabled}
                onChange={handleToggleSync}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                Activar sincronización remota
              </span>
            </label>

            {settings.syncEnabled && (
              <div className="ml-8 space-y-2">
                <input
                  type="text"
                  value={syncToken}
                  onChange={(e) => setSyncToken(e.target.value)}
                  placeholder="Token de sincronización"
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2
                    border border-slate-600 focus:border-blue-500
                    outline-none text-sm"
                />
                <input
                  type="password"
                  value={encryptionPassphrase}
                  onChange={(e) => setEncryptionPassphrase(e.target.value)}
                  placeholder="Frase de cifrado (opcional)"
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2
                    border border-slate-600 focus:border-blue-500
                    outline-none text-sm"
                />
                <Button onClick={handleSaveSyncSettings} size="sm" variant="secondary">
                  Guardar configuración
                </Button>
                <p className="text-xs text-slate-500">
                  Si usas cifrado, asegúrate de recordar la frase.
                </p>
              </div>
            )}
          </div>
        </section>

        <hr className="border-slate-700" />

        {/* Data Management */}
        <section>
          <h3 className="text-lg font-medium text-white mb-3">
            Datos
          </h3>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onExportData} variant="secondary" size="sm">
              Exportar datos
            </Button>
            <Button onClick={onImportData} variant="secondary" size="sm">
              Importar datos
            </Button>
            <Button onClick={handleClearData} variant="danger" size="sm">
              Borrar todo
            </Button>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Los datos se exportan/importan en formato JSON.
          </p>
        </section>

        <hr className="border-slate-700" />

        {/* About */}
        <section>
          <h3 className="text-lg font-medium text-white mb-3">
            Acerca de
          </h3>
          <p className="text-sm text-slate-400">
            Tareas v0.1.0 - Gestor de tareas personal offline-first
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Almacenamiento local en IndexedDB. Funciona sin conexión.
          </p>
        </section>
      </div>
    </Modal>
  );
}
