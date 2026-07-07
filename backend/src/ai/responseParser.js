// Extracts the machine-readable CLUSTERS_DESTACADOS line the agent appends
// to every answer (see docs/Prompt_IA.md, "PROTOCOLO DE SALIDA").

const MARKER = /\n?\s*CLUSTERS_DESTACADOS\s*:\s*(\[[^\]]*\]?)\s*$/i;

export function parseAgentResponse(content) {
  if (typeof content !== 'string') {
    return { respuesta: '', clustersDestacados: [] };
  }

  const match = content.match(MARKER);
  if (!match) {
    return { respuesta: content.trim(), clustersDestacados: [] };
  }

  let clustersDestacados = [];
  try {
    // Models sometimes emit single quotes; normalize before parsing.
    const parsed = JSON.parse(match[1].replace(/'/g, '"'));
    if (Array.isArray(parsed)) {
      clustersDestacados = parsed.filter((item) => typeof item === 'string');
    }
  } catch {
    // Malformed array: keep the answer, highlight nothing.
  }

  return {
    respuesta: content.replace(MARKER, '').trim(),
    clustersDestacados,
  };
}
