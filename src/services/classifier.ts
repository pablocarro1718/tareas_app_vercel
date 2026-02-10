import type { Folder } from '../types';

/**
 * Clasifica una tarea usando la serverless function /api/classify.
 * Devuelve el nombre de la carpeta sugerida, o null si falla.
 */
export async function classifyTask(
  taskText: string,
  folders: Folder[]
): Promise<string | null> {
  if (folders.length === 0) return null;

  const foldersPayload = folders.map((f) => ({
    name: f.name,
    llmContext: f.llmContext,
    keywords: f.keywords,
  }));

  try {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskText, folders: foldersPayload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Classifier] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Classifier] LLM response:', data.folderName);
    return data.folderName || null;
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
