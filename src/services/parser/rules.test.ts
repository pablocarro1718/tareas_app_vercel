import { describe, it, expect } from 'vitest';
import {
  detectBlock,
  detectSubBlocks,
  buildBlockPath,
  detectTaskType,
  detectEntities,
  detectDueDate,
  parseTaskInput
} from './rules';

describe('Parser - Block Detection', () => {
  it('should detect Instachef as a top-level block', () => {
    const result = detectBlock('responder correo alba constitución instachef');
    expect(result).not.toBeNull();
    expect(result?.block).toBe('Instachef');
    expect(result?.confidence).toBeGreaterThan(0.5);
  });

  it('should detect Omme as a top-level block', () => {
    const result = detectBlock('revisar proyecto Omme');
    expect(result).not.toBeNull();
    expect(result?.block).toBe('Omme');
  });

  it('should detect Antai as a top-level block', () => {
    const result = detectBlock('llamar equipo Antai');
    expect(result).not.toBeNull();
    expect(result?.block).toBe('Antai');
  });

  it('should detect Opportunity Circle block', () => {
    const result = detectBlock('preparar presentación opportunity circle');
    expect(result).not.toBeNull();
    expect(result?.block).toBe('Opportunity Circle');
  });

  it('should return null for text without known blocks', () => {
    const result = detectBlock('comprar leche');
    expect(result).toBeNull();
  });
});

describe('Parser - Sub-block Detection', () => {
  it('should detect Constitución as a sub-block', () => {
    const result = detectSubBlocks('docs constitución legal');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(r => r.subBlock === 'Constitución')).toBe(true);
  });

  it('should detect Documentación as a sub-block', () => {
    const result = detectSubBlocks('revisar documentación');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(r => r.subBlock === 'Documentación')).toBe(true);
  });

  it('should detect multiple sub-blocks', () => {
    const result = detectSubBlocks('documentación inversores');
    expect(result.length).toBe(2);
  });
});

describe('Parser - Block Path Building', () => {
  it('should build a complete block path', () => {
    const result = buildBlockPath('responder correo alba constitución instachef');
    expect(result.path).toContain('Instachef');
    expect(result.path).toContain('Constitución');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should return empty path for unknown text', () => {
    const result = buildBlockPath('hola mundo');
    expect(result.path).toHaveLength(0);
    expect(result.confidence).toBe(0);
  });
});

describe('Parser - Task Type Detection', () => {
  it('should detect email task type from "correo"', () => {
    const result = detectTaskType('responder correo alba');
    expect(result.type).toBe('email');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should detect email task type from "responder"', () => {
    const result = detectTaskType('responder mensaje');
    expect(result.type).toBe('email');
  });

  it('should detect intro task type', () => {
    const result = detectTaskType('intro Marta EBISU <> Omme');
    expect(result.type).toBe('intro');
  });

  it('should detect doc task type', () => {
    const result = detectTaskType('acabar doc plan mex 2026');
    expect(result.type).toBe('doc');
  });

  it('should detect call task type', () => {
    const result = detectTaskType('llamar a Carlos');
    expect(result.type).toBe('call');
  });

  it('should detect review task type', () => {
    const result = detectTaskType('revisar contrato');
    expect(result.type).toBe('review');
  });

  it('should detect research task type from "lista"', () => {
    const result = detectTaskType('lista coinversores');
    expect(result.type).toBe('research');
  });

  it('should return "other" for unrecognized patterns', () => {
    const result = detectTaskType('hacer algo');
    expect(result.type).toBe('other');
  });
});

describe('Parser - Entity Detection', () => {
  it('should detect person name from common names list', () => {
    const result = detectEntities('correo alba');
    expect(result.entities).toContain('alba');
  });

  it('should detect capitalized names', () => {
    const result = detectEntities('hablar con Pedro sobre el proyecto');
    expect(result.entities).toContain('Pedro');
  });

  it('should detect company-like patterns (all caps)', () => {
    const result = detectEntities('reunión con ACME Corp');
    expect(result.entities).toContain('ACME');
  });

  it('should detect entities in intro pattern with <>', () => {
    const result = detectEntities('intro Carlos ACME <> Juan CORP');
    expect(result.entities).toContain('Carlos');
    expect(result.entities).toContain('ACME');
  });

  it('should not include block keywords as entities', () => {
    const result = detectEntities('proyecto Instachef');
    expect(result.entities).not.toContain('Instachef');
  });
});

describe('Parser - Due Date Detection', () => {
  it('should detect "hoy" as today', () => {
    const result = detectDueDate('hacer esto hoy');
    expect(result.date).not.toBeNull();
    const today = new Date().toISOString().split('T')[0];
    expect(result.date).toBe(today);
  });

  it('should detect "mañana" as tomorrow', () => {
    const result = detectDueDate('entregar mañana');
    expect(result.date).not.toBeNull();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.date).toBe(tomorrow.toISOString().split('T')[0]);
  });

  it('should detect explicit date format DD/MM', () => {
    const result = detectDueDate('entregar 15/01');
    expect(result.date).not.toBeNull();
    expect(result.date).toContain('-01-15');
  });

  it('should return null for text without dates', () => {
    const result = detectDueDate('hacer algo importante');
    expect(result.date).toBeNull();
  });
});

describe('Parser - Full Parse', () => {
  it('should parse a complete task input', () => {
    const result = parseTaskInput('responder correo alba constitución instachef');

    expect(result.blockPath).toContain('Instachef');
    expect(result.blockPath).toContain('Constitución');
    expect(result.taskType).toBe('email');
    expect(result.entities).toContain('alba');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should generate chip suggestions', () => {
    const result = parseTaskInput('acabar doc plan mex 2026 instachef');

    const blockSuggestions = result.suggestions.filter(s => s.type === 'block');
    const typeSuggestions = result.suggestions.filter(s => s.type === 'taskType');

    expect(blockSuggestions.length).toBeGreaterThan(0);
    expect(typeSuggestions.length).toBeGreaterThan(0);
  });

  it('should handle minimal input', () => {
    const result = parseTaskInput('x');

    expect(result.blockPath).toHaveLength(0);
    expect(result.taskType).toBe('other');
    expect(result.entities).toHaveLength(0);
  });

  it('should parse example: "Acabar 221 recetas Instachef"', () => {
    const result = parseTaskInput('Acabar 221 recetas Instachef');

    expect(result.blockPath).toContain('Instachef');
    expect(result.blockPath).toContain('Recetas');
  });

  it('should parse example: "Lista coinversores"', () => {
    const result = parseTaskInput('Lista coinversores');

    expect(result.taskType).toBe('research');
    expect(result.blockPath).toContain('Inversores');
  });
});
