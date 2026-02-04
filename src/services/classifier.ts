import type { Folder } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Clasifica una tarea usando Claude Haiku.
 * Devuelve el nombre de la carpeta sugerida, o null si falla.
 */
export async function classifyTask(
  taskText: string,
  folders: Folder[],
  apiKey: string
): Promise<string | null> {
  if (!apiKey || folders.length === 0) return null;

  const foldersDescription = folders
    .map((f) => {
      let desc = `## ${f.name}`;
      if (f.llmContext) desc += `\nContexto: ${f.llmContext}`;
      if (f.keywords.length > 0) desc += `\nPalabras clave: ${f.keywords.join(', ')}`;
      return desc;
    })
    .join('\n\n');

  const folderNames = folders.map((f) => f.name).join(', ');

  const prompt = `Eres un clasificador de tareas. Tu trabajo es asignar cada tarea a la carpeta más apropiada.

CARPETAS DISPONIBLES:
${foldersDescription}

TAREA A CLASIFICAR: "${taskText}"

INSTRUCCIONES:
- Analiza el contexto y palabras clave de cada carpeta
- Elige la carpeta que mejor se relacione con la tarea
- DEBES elegir una de estas carpetas: ${folderNames}
- Responde ÚNICAMENTE con el nombre exacto de la carpeta, sin explicaciones
- Solo responde "General" si la tarea no tiene NINGUNA relación con ninguna carpeta`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Classifier] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim();
    console.log('[Classifier] LLM response:', content);
    return content || null;
  } catch (error) {
    console.error('[Classifier] Exception:', error);
    return null;
  }
}

/**
 * Encuentra la carpeta que coincide con el nombre sugerido.
 * Matching case-insensitive y parcial.
 */
export function findFolderByName(
  suggestedName: string,
  folders: Folder[]
): Folder | null {
  if (!suggestedName || suggestedName.toLowerCase() === 'general') {
    console.log('[Classifier] No folder match - "General" or empty');
    return null;
  }

  const lower = suggestedName.toLowerCase().trim();

  // Exact match
  const exact = folders.find((f) => f.name.toLowerCase().trim() === lower);
  if (exact) {
    console.log('[Classifier] Exact match found:', exact.name);
    return exact;
  }

  // Partial match (suggested name contains folder name or vice versa)
  const partial = folders.find(
    (f) =>
      f.name.toLowerCase().includes(lower) ||
      lower.includes(f.name.toLowerCase())
  );
  if (partial) {
    console.log('[Classifier] Partial match found:', partial.name);
    return partial;
  }

  console.log('[Classifier] No match found for:', suggestedName, 'in folders:', folders.map(f => f.name));
  return null;
}
