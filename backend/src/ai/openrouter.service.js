import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { getDefaultModel } from './model.registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// The system prompt is source-of-truth code, co-located in the AI module.
// The whole file is the prompt (no markdown fence, no regex). docs/Prompt_IA.md
// only documents the rationale behind it.
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'system-prompt.md'), 'utf-8').trim();

// Upstream (OpenRouter/provider) can hang or queue a request indefinitely.
// Without a server-side timeout the fetch never resolves and the whole HTTP
// request hangs. Abort well under the frontend request timeout so the client
// receives a clean error instead of waiting forever.
const OPENROUTER_TIMEOUT_MS = 45_000;

export async function callOpenRouter(userMessage, model) {
  if (!env.OPENROUTER_API_KEY) {
    return {
      role: 'assistant',
      content: `[MOCK] Basado en los datos proporcionados, se identificaron las siguientes brechas territoriales en la región consultada. **Sugerencia estratégica:** Se recomienda priorizar inversión en infraestructura 4G en las zonas identificadas antes de implementar programas de inclusión digital.\n\nCLUSTERS_DESTACADOS: ["SANTO_AMARO"]`,
    };
  }

  let response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Per-request model resolved by the caller (body > user preference).
        // Falls back to the server default (see model.registry.js).
        model: model || getDefaultModel(),
        // Cap length: the system prompt asks for ~120 words, but some models
        // (e.g. DeepSeek) ignore it and ramble, which raises latency and trips
        // the frontend request timeout. max_tokens is the hard guardrail.
        max_tokens: 700,
        temperature: 0.5,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error(
        `OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s (provider hung or queued)`,
        { cause: err }
      );
    }
    throw new Error(`OpenRouter request failed: ${err?.message ?? err}`, { cause: err });
  }

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
