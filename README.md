# Tareas - Gestor de Tareas Personal Offline-First

Una aplicación PWA para gestión de tareas personales con captura rápida tipo chat, agrupación visual jerárquica y funcionamiento completamente offline.

## Características

- **Captura rápida**: Input tipo chat donde escribes una tarea y la creas con Enter
- **Clasificación automática**: Detecta bloques, entidades, tipo de tarea y fechas
- **Chips sugeridos**: Sugerencias opcionales que puedes aceptar o ignorar
- **Vista agrupada**: Tareas organizadas por bloques jerárquicos (ej: Instachef > Constitución > Docs)
- **Offline-first**: Todo se guarda en IndexedDB, funciona sin conexión
- **PWA**: Instalable como app nativa en móvil y escritorio
- **Sin autenticación**: 100% local, sin cuentas ni servidores

## Tecnologías

- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS v4
- **Base de datos**: IndexedDB via Dexie.js
- **PWA**: vite-plugin-pwa + Workbox
- **Tests**: Vitest

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd todoapp

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview

# Ejecutar tests
npm run test
```

## Uso

### Crear una tarea

1. Escribe en el input de abajo (ej: "responder correo alba constitución instachef")
2. Verás chips sugeridos con bloques, entidades, tipo y fecha detectados
3. Pulsa Enter o el botón + para crear la tarea
4. Los chips son opcionales - la tarea se guarda aunque no los uses

### Ejemplos de entrada

```
responder correo alba constitución instachef
acabar doc plan mex 2026
intro Marta EBISU <> Omme
Acabar 221 recetas Instachef
Lista coinversores
```

### Gestionar tareas

- **Click en el círculo**: Cambia el estado (pendiente → en progreso → completada)
- **Click en la tarea**: Abre el editor para editar título, bloque, fecha, subtareas, notas
- **Icono de papelera**: Descarta la tarea (se oculta pero se puede recuperar)

### Bloques conocidos

El parser detecta automáticamente estos bloques:
- Instachef, Omme, Antai, Antai General, Antai Admin, Opportunity Circle, EBISU, Personal

Y estos sub-bloques:
- Constitución, Documentación, Inversores, Recetas, Marketing, Producto, Tech, Finanzas, RRHH, Operaciones

## Arquitectura

```
src/
├── components/          # Componentes React
│   ├── capture/         # Input de captura tipo chat
│   ├── tasks/           # Lista, items, editor de tareas
│   ├── settings/        # Panel de ajustes
│   └── ui/              # Componentes reutilizables (Chip, Button, Modal)
├── db/                  # Capa de base de datos
│   ├── database.ts      # Dexie.js schema y operaciones CRUD
│   └── seed.ts          # Datos de ejemplo
├── hooks/               # React hooks
│   ├── useTasks.ts      # Gestión de tareas
│   ├── useBlocks.ts     # Agrupación por bloques
│   └── useSettings.ts   # Configuración de la app
├── services/
│   ├── parser/          # Parser de texto
│   │   ├── rules.ts     # Clasificador basado en reglas
│   │   └── llm.ts       # Clasificador LLM (stub)
│   └── sync/            # Proveedores de sincronización
│       ├── local.ts     # Proveedor local (default)
│       └── remote.ts    # Proveedor remoto (stub)
└── types/               # Tipos TypeScript
```

### Flujo de datos

1. Usuario escribe texto → `parseTaskInput()` extrae metadatos
2. Se muestran chips sugeridos → Usuario puede aceptar/rechazar
3. Al crear tarea → Se guarda en IndexedDB con `createTask()`
4. El hook `useTasks()` reactivamente actualiza la UI via `useLiveQuery()`
5. `useBlocks()` agrupa las tareas para la vista jerárquica

### Sincronización

La app implementa una interfaz `SyncProvider`:

```typescript
interface SyncProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  push(tasks: Task[]): Promise<void>;
  pull(): Promise<Task[]>;
  getLastSyncTime(): Promise<string | null>;
}
```

- **LocalSyncProvider**: Default, solo guarda en IndexedDB
- **RemoteSyncProvider**: Stub para sincronización remota (v1)

### Modelo de datos

```typescript
interface Task {
  id: string;
  rawText: string;      // Texto original inmutable
  title: string;        // Título editable
  blockPath: string[];  // Jerarquía de bloques
  status: 'todo' | 'doing' | 'done';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags?: string[];
  subTasks?: SubTask[];
  blocked?: BlockedStatus;
  dismissed?: boolean;
  notes?: string;
}
```

## Configuración

En Ajustes puedes:

- **Activar IA**: Usa un modelo de lenguaje para mejorar clasificación (requiere API key)
- **Sincronización**: Activar sync remoto (stub en v0)
- **Exportar/Importar**: Backup en JSON
- **Borrar todo**: Limpiar la base de datos

## Tests

```bash
# Ejecutar tests en modo watch
npm run test

# Ejecutar tests una vez
npm run test:run
```

Los tests cubren:
- Detección de bloques
- Detección de sub-bloques
- Clasificación de tipos de tarea
- Detección de entidades (personas/empresas)
- Detección de fechas
- Parsing completo

## Roadmap

### v0.2 - Captura via Telegram
- Bot de Telegram para agregar tareas enviando mensajes
- Sincronización con la app web

### v1.0 - Sync real
- Backend con API REST
- Autenticación con token secreto
- Cifrado E2E opcional con passphrase
- Sincronización bidireccional con resolución de conflictos

### v2.0 - Planificación
- Vista calendario
- Priorización automática
- Recordatorios push
- Integración con calendarios externos

## Licencia

MIT

---

Desarrollado como herramienta personal de productividad.
