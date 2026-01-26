interface ChipProps {
  label: string;
  type?: 'block' | 'entity' | 'taskType' | 'date' | 'default';
  removable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const typeColors = {
  block: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  entity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  taskType: 'bg-green-500/20 text-green-300 border-green-500/30',
  date: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  default: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
};

const typeIcons = {
  block: '📁',
  entity: '👤',
  taskType: '📋',
  date: '📅',
  default: '🏷️'
};

export function Chip({
  label,
  type = 'default',
  removable = false,
  selected = false,
  onClick,
  onRemove,
  size = 'md'
}: ChipProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${typeColors[type]}
        ${sizeClasses}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${selected ? 'ring-2 ring-white/30' : ''}
        transition-all duration-150
      `}
      onClick={onClick}
    >
      <span className="text-xs">{typeIcons[type]}</span>
      <span>{label}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 hover:text-white transition-colors"
          aria-label="Eliminar"
        >
          ×
        </button>
      )}
    </span>
  );
}
