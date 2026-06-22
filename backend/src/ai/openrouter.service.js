import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '../../../docs/Prompt_IA.md'),
  'utf-8'
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

export async function callOpenRouter(userMessage) {
  if (!OPENROUTER_API_KEY) {
    return {
      role: 'assistant',
      content: `[MOCK] Basado en los datos proporcionados, se identificaron las siguientes brechas territoriales en la región consultada. **Sugerencia estratégica:** Se recomienda priorizar inversión en infraestructura 4G en las zonas identificadas antes de implementar programas de inclusión digital.`
    };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message;
}