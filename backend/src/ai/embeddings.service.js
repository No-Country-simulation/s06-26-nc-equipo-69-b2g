const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const EMBED_MODEL = process.env.EMBED_MODEL || 'nvidia/llama-nemotron-embed-vl-1b-v2:free';

/**
 * Embed text with the OpenRouter embeddings endpoint (nemotron by default).
 * Returns the embedding vector (array of numbers) or null when embeddings are
 * unavailable (no API key or request failure) so callers can degrade to a
 * no-RAG response instead of throwing.
 */
export async function embedText(text) {
  if (!OPENROUTER_API_KEY) return null;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}
