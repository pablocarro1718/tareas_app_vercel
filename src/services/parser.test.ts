import { describe, it, expect } from 'vitest';
import { parseTaskInput } from './parser';

describe('parseTaskInput', () => {
  it('parses plain text', () => {
    const result = parseTaskInput('Comprar leche');
    expect(result).toEqual({
      text: 'Comprar leche',
      taskGroupName: null,
      priority: null,
    });
  });

  it('extracts priority from end', () => {
    expect(parseTaskInput('Llamar al banco mid')).toEqual({
      text: 'Llamar al banco',
      taskGroupName: null,
      priority: 'mid',
    });
    expect(parseTaskInput('Urgente high')).toEqual({
      text: 'Urgente',
      taskGroupName: null,
      priority: 'high',
    });
    expect(parseTaskInput('Revisar correo low')).toEqual({
      text: 'Revisar correo',
      taskGroupName: null,
      priority: 'low',
    });
  });

  it('extracts task group name with >', () => {
    expect(parseTaskInput('Comprar leche > Compras')).toEqual({
      text: 'Comprar leche',
      taskGroupName: 'Compras',
      priority: null,
    });
  });

  it('extracts both group and priority', () => {
    expect(parseTaskInput('Tarea importante > Urgente high')).toEqual({
      text: 'Tarea importante',
      taskGroupName: 'Urgente',
      priority: 'high',
    });
  });

  it('handles priority case-insensitive', () => {
    expect(parseTaskInput('Test HIGH').priority).toBe('high');
    expect(parseTaskInput('Test Low').priority).toBe('low');
    expect(parseTaskInput('Test MID').priority).toBe('mid');
  });

  it('handles whitespace', () => {
    expect(parseTaskInput('  Tarea  >  Grupo  low  ')).toEqual({
      text: 'Tarea',
      taskGroupName: 'Grupo',
      priority: 'low',
    });
  });
});
