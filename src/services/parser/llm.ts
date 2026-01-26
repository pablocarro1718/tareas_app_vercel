import type { LLMExtractionResult, ParsingResult } from '../../types';
import { v4 as uuid } from 'uuid';
import { parseTaskInput } from './rules';

/**
 * Placeholder LLM extraction function
 *
 * In a real implementation, this would call an LLM API (e.g., OpenAI, Anthropic)
 * to extract structured data from the raw task text.
 *
 * For now, it returns the rule-based parsing with a slight enhancement
 * to simulate LLM behavior.
 */
export async function extractWithLLM(
  text: string,
  _apiKey?: string
): Promise<LLMExtractionResult> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 100));

  // In production, this would be a real API call like:
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${apiKey}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [{
  //       role: 'system',
  //       content: `You are a task extraction assistant. Extract structured information from Spanish task inputs.
  //         Return JSON with: blockPath (array), entities (array), taskType (email|intro|doc|research|call|meeting|review|other), dueDate (ISO string or null).`
  //     }, {
  //       role: 'user',
  //       content: text
  //     }]
  //   })
  // });

  // For now, use rule-based parsing with boosted confidence
  const ruleBased = parseTaskInput(text);

  return {
    blockPath: ruleBased.blockPath,
    entities: ruleBased.entities,
    taskType: ruleBased.taskType,
    dueDate: ruleBased.dueDate || undefined,
    confidence: Math.min(ruleBased.overallConfidence + 0.1, 1) // Slightly higher confidence for "LLM"
  };
}

/**
 * Creates a parsing result from LLM extraction
 */
export async function createLLMParsingResult(
  taskId: string,
  text: string,
  apiKey?: string
): Promise<ParsingResult> {
  const extraction = await extractWithLLM(text, apiKey);

  return {
    id: uuid(),
    taskId,
    inferredBlockPath: extraction.blockPath.length > 0 ? extraction.blockPath : undefined,
    inferredEntities: extraction.entities.length > 0 ? extraction.entities : undefined,
    inferredTaskType: extraction.taskType,
    inferredDueDate: extraction.dueDate,
    confidence: extraction.confidence,
    source: 'llm',
    createdAt: new Date().toISOString()
  };
}

/**
 * Mock LLM API endpoint contract
 *
 * This documents the expected API contract for a real LLM integration:
 *
 * POST /api/extract
 * Headers:
 *   Authorization: Bearer <api_key>
 *   Content-Type: application/json
 *
 * Request Body:
 * {
 *   "text": "responder correo alba constitución instachef",
 *   "language": "es",
 *   "context": {
 *     "knownBlocks": ["Instachef", "Omme", "Antai"],
 *     "knownEntities": ["Alba", "Marta", "Carlos"]
 *   }
 * }
 *
 * Response (200 OK):
 * {
 *   "blockPath": ["Instachef", "Constitución"],
 *   "entities": ["Alba"],
 *   "taskType": "email",
 *   "dueDate": null,
 *   "confidence": 0.92
 * }
 */
export const LLM_API_CONTRACT = {
  endpoint: '/api/extract',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <api_key>',
    'Content-Type': 'application/json'
  },
  requestSchema: {
    text: 'string',
    language: 'es | en',
    context: {
      knownBlocks: 'string[]',
      knownEntities: 'string[]'
    }
  },
  responseSchema: {
    blockPath: 'string[]',
    entities: 'string[]',
    taskType: 'TaskType',
    dueDate: 'string | null',
    confidence: 'number (0-1)'
  }
};
