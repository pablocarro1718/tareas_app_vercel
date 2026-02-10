import type { VercelRequest, VercelResponse } from '@vercel/node';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface FolderInfo {
  name: string;
  llmContext: string;
  keywords: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { taskText, folders } = req.body as {
    taskText: string;
    folders: FolderInfo[];
  };

  if (!taskText || !folders || folders.length === 0) {
    return res.status(400).json({ error: 'taskText and folders are required' });
  }

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
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[classify] Anthropic API error:', response.status, errorText);
      return res.status(502).json({ error: 'Anthropic API error', status: response.status });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim() ?? null;

    return res.status(200).json({ folderName: content });
  } catch (error) {
    console.error('[classify] Exception:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
