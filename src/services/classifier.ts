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

  const prompt = `Eres un clasificador de tareas. El usuario tiene las siguientes carpetas:

${foldersDescription}

Tarea a clasificar: "${taskText}"

Responde SOLO con el nombre exacto de la carpeta donde debe ir esta tarea. Si no estás seguro, responde "General".`;

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

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim();
    return content || null;
  } catch {
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
  if (!suggestedName || suggestedName === 'General') return null;

  const lower = suggestedName.toLowerCase();

  // Exact match
  const exact = folders.find((f) => f.name.toLowerCase() === lower);
  if (exact) return exact;

  // Partial match (suggested name contains folder name or vice versa)
  const partial = folders.find(
    (f) =>
      f.name.toLowerCase().includes(lower) ||
      lower.includes(f.name.toLowerCase())
  );
  return partial || null;
}
