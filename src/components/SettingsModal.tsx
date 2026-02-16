interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative rounded-2xl w-full max-w-sm p-6 space-y-5"
        style={{ backgroundColor: '#1c1c1e', animation: 'modal-enter 200ms ease-out' }}
      >
        <h2 className="text-lg font-semibold text-white">Configuración</h2>

        <p className="text-sm text-zinc-400">
          La clasificación automática de tareas está activa. Las tareas se asignan a carpetas usando IA.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-white bg-blue-500 font-medium active:bg-blue-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
