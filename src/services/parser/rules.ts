import type { TaskType, ChipSuggestion, ParsingResult } from '../../types';
import { v4 as uuid } from 'uuid';

// Known top-level blocks and their variations
const BLOCK_KEYWORDS: Record<string, string[]> = {
  'Instachef': ['instachef', 'insta chef', 'ic'],
  'Omme': ['omme'],
  'Antai': ['antai'],
  'Antai General': ['antai general'],
  'Antai Admin': ['antai admin', 'admin antai'],
  'Opportunity Circle': ['opportunity circle', 'opp circle', 'oc'],
  'EBISU': ['ebisu'],
  'Personal': ['personal', 'yo', 'casa'],
};

// Sub-block keywords (contextual)
const SUB_BLOCK_KEYWORDS: Record<string, string[]> = {
  'Constitución': ['constitución', 'constitucion', 'legal'],
  'Documentación': ['documentación', 'documentacion', 'docs', 'doc'],
  'Inversores': ['inversores', 'investors', 'coinversores'],
  'Recetas': ['recetas', 'recipes'],
  'Marketing': ['marketing', 'mkt'],
  'Producto': ['producto', 'product'],
  'Tech': ['tech', 'desarrollo', 'dev'],
  'Finanzas': ['finanzas', 'finance', 'contabilidad'],
  'RRHH': ['rrhh', 'hr', 'equipo', 'team'],
  'Operaciones': ['operaciones', 'ops'],
};

// Task type detection patterns
const TASK_TYPE_PATTERNS: { type: TaskType; patterns: RegExp[] }[] = [
  {
    type: 'email',
    patterns: [
      /\bcorreo\b/i,
      /\bresponder\b/i,
      /\bmail\b/i,
      /\bemail\b/i,
      /\benviar\b/i,
      /\bcontestar\b/i,
    ]
  },
  {
    type: 'intro',
    patterns: [
      /\bintro\b/i,
      /\bpresentar\b/i,
      /\bconectar\b/i,
      /\b<>\b/,
      /\bintroducir\b/i,
    ]
  },
  {
    type: 'call',
    patterns: [
      /\bllamar\b/i,
      /\bllamada\b/i,
      /\bcall\b/i,
      /\bhablar con\b/i,
    ]
  },
  {
    type: 'meeting',
    patterns: [
      /\breunión\b/i,
      /\breunion\b/i,
      /\bmeeting\b/i,
      /\bjunta\b/i,
    ]
  },
  {
    type: 'doc',
    patterns: [
      /\bdoc\b/i,
      /\bdocumento\b/i,
      /\bdocumentación\b/i,
      /\bplan\b/i,
      /\bescribir\b/i,
      /\bredactar\b/i,
    ]
  },
  {
    type: 'review',
    patterns: [
      /\brevisar\b/i,
      /\breview\b/i,
      /\bchequear\b/i,
      /\bverificar\b/i,
    ]
  },
  {
    type: 'research',
    patterns: [
      /\binvestigar\b/i,
      /\bresearch\b/i,
      /\bbuscar\b/i,
      /\blista\b/i,
    ]
  },
];

// Action verbs to detect (for confidence boost)
const ACTION_VERBS = [
  'acabar', 'terminar', 'completar', 'hacer', 'crear', 'preparar',
  'enviar', 'responder', 'llamar', 'revisar', 'actualizar', 'subir',
  'bajar', 'descargar', 'compartir', 'organizar', 'programar', 'agendar',
];

// Date patterns (Spanish)
const DATE_PATTERNS = [
  { pattern: /\bhoy\b/i, daysFromNow: 0 },
  { pattern: /\bmañana\b/i, daysFromNow: 1 },
  { pattern: /\bpasado mañana\b/i, daysFromNow: 2 },
  { pattern: /\beste lunes\b/i, weekday: 1 },
  { pattern: /\beste martes\b/i, weekday: 2 },
  { pattern: /\beste miércoles\b/i, weekday: 3 },
  { pattern: /\beste jueves\b/i, weekday: 4 },
  { pattern: /\beste viernes\b/i, weekday: 5 },
  { pattern: /\besta semana\b/i, daysFromNow: 7 },
  { pattern: /\bpróxima semana\b/i, daysFromNow: 14 },
  { pattern: /\bfin de mes\b/i, endOfMonth: true },
  // Explicit date: "15 enero", "15/01", etc.
  { pattern: /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/, explicit: true },
  { pattern: /\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i, monthName: true },
];

// Common Spanish names (for entity detection)
const COMMON_NAMES = [
  'alba', 'marta', 'carlos', 'miguel', 'david', 'pablo', 'jorge', 'antonio',
  'jose', 'francisco', 'manuel', 'juan', 'pedro', 'luis', 'javier', 'rafael',
  'fernando', 'sergio', 'daniel', 'alejandro', 'maria', 'carmen', 'ana', 'laura',
  'cristina', 'elena', 'isabel', 'patricia', 'rosa', 'lucia', 'sara', 'paula',
  'sofia', 'andrea', 'raquel', 'silvia', 'nuria', 'eva', 'beatriz', 'ines',
];

/**
 * Detects the top-level block from input text
 */
export function detectBlock(text: string): { block: string; confidence: number } | null {
  const lowerText = text.toLowerCase();

  for (const [block, keywords] of Object.entries(BLOCK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Higher confidence for exact word match
        const isExactMatch = new RegExp(`\\b${keyword}\\b`, 'i').test(lowerText);
        return {
          block,
          confidence: isExactMatch ? 0.9 : 0.7
        };
      }
    }
  }

  return null;
}

/**
 * Detects sub-blocks from input text
 */
export function detectSubBlocks(text: string): { subBlock: string; confidence: number }[] {
  const lowerText = text.toLowerCase();
  const results: { subBlock: string; confidence: number }[] = [];

  for (const [subBlock, keywords] of Object.entries(SUB_BLOCK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        const isExactMatch = new RegExp(`\\b${keyword}\\b`, 'i').test(lowerText);
        results.push({
          subBlock,
          confidence: isExactMatch ? 0.85 : 0.65
        });
        break; // Only add each sub-block once
      }
    }
  }

  return results;
}

/**
 * Builds the full block path from detected blocks
 */
export function buildBlockPath(text: string): { path: string[]; confidence: number } {
  const mainBlock = detectBlock(text);
  const subBlocks = detectSubBlocks(text);

  if (!mainBlock && subBlocks.length === 0) {
    return { path: [], confidence: 0 };
  }

  const path: string[] = [];
  let totalConfidence = 0;
  let count = 0;

  if (mainBlock) {
    path.push(mainBlock.block);
    totalConfidence += mainBlock.confidence;
    count++;
  }

  // Sort sub-blocks by confidence and add top ones
  subBlocks.sort((a, b) => b.confidence - a.confidence);
  for (const sub of subBlocks.slice(0, 2)) { // Max 2 sub-blocks
    path.push(sub.subBlock);
    totalConfidence += sub.confidence;
    count++;
  }

  return {
    path,
    confidence: count > 0 ? totalConfidence / count : 0
  };
}

/**
 * Detects task type from input text
 */
export function detectTaskType(text: string): { type: TaskType; confidence: number } {
  for (const { type, patterns } of TASK_TYPE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { type, confidence: 0.8 };
      }
    }
  }

  // Check for action verbs as fallback
  const lowerText = text.toLowerCase();
  for (const verb of ACTION_VERBS) {
    if (lowerText.includes(verb)) {
      return { type: 'other', confidence: 0.5 };
    }
  }

  return { type: 'other', confidence: 0.3 };
}

/**
 * Detects entities (people/companies) from input text
 */
export function detectEntities(text: string): { entities: string[]; confidence: number } {
  const entities: string[] = [];
  const words = text.split(/\s+/);

  // Look for capitalized words that aren't at the start of a sentence
  // and aren't common Spanish words
  const skipWords = new Set([
    'de', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'o', 'que', 'en', 'con',
    'para', 'por', 'al', 'del', 'se', 'su', 'es', 'si', 'no', 'como', 'más',
    // Also skip block/task keywords
    ...Object.keys(BLOCK_KEYWORDS).map(k => k.toLowerCase()),
    ...Object.values(BLOCK_KEYWORDS).flat(),
    ...Object.keys(SUB_BLOCK_KEYWORDS).map(k => k.toLowerCase()),
    ...Object.values(SUB_BLOCK_KEYWORDS).flat(),
  ]);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const cleanWord = word.replace(/[.,;:!?()]/g, '');

    // Skip if empty or too short
    if (cleanWord.length < 2) continue;

    // Check if it's a known name
    if (COMMON_NAMES.includes(cleanWord.toLowerCase())) {
      entities.push(cleanWord);
      continue;
    }

    // Check if it starts with uppercase (but not at sentence start)
    if (i > 0 && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(cleanWord)) {
      if (!skipWords.has(cleanWord.toLowerCase())) {
        entities.push(cleanWord);
      }
    }

    // Check for company-like patterns (e.g., "EBISU", all caps)
    if (/^[A-Z]{2,}$/.test(cleanWord) && !skipWords.has(cleanWord.toLowerCase())) {
      entities.push(cleanWord);
    }
  }

  // Look for "intro X <> Y" pattern
  const introPattern = /<>/;
  if (introPattern.test(text)) {
    const parts = text.split('<>').map(p => p.trim());
    for (const part of parts) {
      const lastWord = part.split(/\s+/).pop();
      if (lastWord && /^[A-ZÁÉÍÓÚÑ]/.test(lastWord)) {
        const cleanWord = lastWord.replace(/[.,;:!?()]/g, '');
        if (!entities.includes(cleanWord) && !skipWords.has(cleanWord.toLowerCase())) {
          entities.push(cleanWord);
        }
      }
    }
  }

  return {
    entities: [...new Set(entities)], // Deduplicate
    confidence: entities.length > 0 ? 0.7 : 0
  };
}

/**
 * Detects due date from input text
 */
export function detectDueDate(text: string): { date: string | null; confidence: number } {
  const now = new Date();

  for (const datePattern of DATE_PATTERNS) {
    const match = text.match(datePattern.pattern);
    if (match) {
      let date: Date | null = null;

      if ('daysFromNow' in datePattern && datePattern.daysFromNow !== undefined) {
        date = new Date(now);
        date.setDate(date.getDate() + datePattern.daysFromNow);
      } else if ('weekday' in datePattern && datePattern.weekday !== undefined) {
        date = new Date(now);
        const currentDay = date.getDay();
        const targetDay = datePattern.weekday;
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        date.setDate(date.getDate() + daysToAdd);
      } else if ('endOfMonth' in datePattern && datePattern.endOfMonth) {
        date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if ('explicit' in datePattern && datePattern.explicit && match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = match[3] ? parseInt(match[3]) : now.getFullYear();
        date = new Date(year < 100 ? 2000 + year : year, month, day);
      } else if ('monthName' in datePattern && datePattern.monthName && match) {
        const day = parseInt(match[1]);
        const monthNames = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const month = monthNames.indexOf(match[2].toLowerCase());
        if (month !== -1) {
          date = new Date(now.getFullYear(), month, day);
          // If the date is in the past, assume next year
          if (date < now) {
            date.setFullYear(date.getFullYear() + 1);
          }
        }
      }

      if (date) {
        return {
          date: date.toISOString().split('T')[0],
          confidence: 0.85
        };
      }
    }
  }

  return { date: null, confidence: 0 };
}

/**
 * Main parsing function - combines all detection methods
 */
export function parseTaskInput(text: string): {
  blockPath: string[];
  entities: string[];
  taskType: TaskType;
  dueDate: string | null;
  overallConfidence: number;
  suggestions: ChipSuggestion[];
} {
  const blockResult = buildBlockPath(text);
  const typeResult = detectTaskType(text);
  const entityResult = detectEntities(text);
  const dateResult = detectDueDate(text);

  // Build suggestions for chips
  const suggestions: ChipSuggestion[] = [];

  // Block suggestions
  for (const block of blockResult.path) {
    suggestions.push({
      type: 'block',
      value: block,
      label: block,
      confidence: blockResult.confidence
    });
  }

  // Entity suggestions
  for (const entity of entityResult.entities) {
    suggestions.push({
      type: 'entity',
      value: entity,
      label: entity,
      confidence: entityResult.confidence
    });
  }

  // Task type suggestion
  if (typeResult.type !== 'other' || typeResult.confidence > 0.5) {
    suggestions.push({
      type: 'taskType',
      value: typeResult.type,
      label: getTaskTypeLabel(typeResult.type),
      confidence: typeResult.confidence
    });
  }

  // Date suggestion
  if (dateResult.date) {
    suggestions.push({
      type: 'date',
      value: dateResult.date,
      label: formatDateLabel(dateResult.date),
      confidence: dateResult.confidence
    });
  }

  // Calculate overall confidence
  const confidences = [
    blockResult.confidence,
    typeResult.confidence,
    entityResult.confidence,
    dateResult.confidence
  ].filter(c => c > 0);

  const overallConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    blockPath: blockResult.path,
    entities: entityResult.entities,
    taskType: typeResult.type,
    dueDate: dateResult.date,
    overallConfidence,
    suggestions
  };
}

/**
 * Creates a parsing result entity for storage
 */
export function createParsingResult(taskId: string, text: string): ParsingResult {
  const parsed = parseTaskInput(text);

  return {
    id: uuid(),
    taskId,
    inferredBlockPath: parsed.blockPath.length > 0 ? parsed.blockPath : undefined,
    inferredEntities: parsed.entities.length > 0 ? parsed.entities : undefined,
    inferredTaskType: parsed.taskType,
    inferredDueDate: parsed.dueDate || undefined,
    confidence: parsed.overallConfidence,
    source: 'rules',
    createdAt: new Date().toISOString()
  };
}

// Helper functions
function getTaskTypeLabel(type: TaskType): string {
  const labels: Record<TaskType, string> = {
    email: 'Correo',
    intro: 'Intro',
    doc: 'Documento',
    research: 'Investigar',
    call: 'Llamada',
    meeting: 'Reunión',
    review: 'Revisar',
    other: 'Otro'
  };
  return labels[type];
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Mañana';
  }

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
}
