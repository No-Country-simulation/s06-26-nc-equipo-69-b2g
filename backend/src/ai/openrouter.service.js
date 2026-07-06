import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const systemPromptDocument = readFileSync(join(__dirname, '../../../docs/Prompt_IA.md'), 'utf-8');
const SYSTEM_PROMPT =
  systemPromptDocument.match(/```text\n([\s\S]*?)\n```/)?.[1]?.trim() ?? systemPromptDocument;

export async function callOpenRouter(userMessage) {
  if (!env.OPENROUTER_API_KEY) {
    return {
      role: 'assistant',
      content: `[MOCK] Basado en los datos proporcionados, se identificaron las siguientes brechas territoriales en la región consultada. **Sugerencia estratégica:** Se recomienda priorizar inversión en infraestructura 4G en las zonas identificadas antes de implementar programas de inclusión digital.\n\nCLUSTERS_DESTACADOS: ["SANTO_AMARO"]`,
    };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `OpenRouter error: ${response.status} ${response.statusText} — ${body || '(sin cuerpo)'}`
    );
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  if (!message) {
    throw new Error(`OpenRouter returned no choices: ${JSON.stringify(data)}`);
  }
  return message;
}
