import { callOpenRouter } from '../../ai/openrouter.service.js';
import { embedText } from '../../ai/embeddings.service.js';
import { supabase } from '../../lib/supabase.js';

export async function queryData(req, res, next) {
  try {
    const { prompt, region, indicator, language } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // 1) Datos estructurados agregados (tablas con public read).
    //    riesgo_regiao es la salida principal del producto (score por cluster).
    let riesgoQuery = supabase.from('riesgo_regiao').select('*');
    if (region) riesgoQuery = riesgoQuery.eq('cluster', region);
    const { data: riesgo, error: riesgoError } = await riesgoQuery.limit(50);
    if (riesgoError) throw riesgoError;

    let concQuery = supabase
      .from('tensor_concentracao')
      .select('cluster, periodo, n_usuarios, drop_pct_medio, congestionamento_medio, download_bytes, lat, lon');
    if (region) concQuery = concQuery.eq('cluster', region);
    const { data: concentracao, error: concError } = await concQuery.limit(50);
    if (concError) throw concError;

    let antenasQuery = supabase
      .from('antenas_flp')
      .select('ecgi, cluster, municipio, lat, lon');
    if (region) antenasQuery = antenasQuery.eq('cluster', region);
    const { data: antenas, error: antenasError } = await antenasQuery.limit(50);
    if (antenasError) throw antenasError;

    // 2) RAG: recuperar conocimiento de dominio por similitud semántica.
    //    embedText devuelve null si no hay API key -> se degrada sin contexto.
    let ragChunks = [];
    const embedding = await embedText(prompt);
    if (embedding) {
      const { data: matches, error: matchError } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_count: 5,
      });
      if (!matchError && Array.isArray(matches)) ragChunks = matches;
    }

    // 3) Construir el contexto para el LLM (conocimiento + números).
    const contexto = ragChunks
      .map((c) => `[${c.fuente} · ${c.seccion}]\n${c.contenido}`)
      .join('\n\n');

    const userMessage = `
Consulta del usuario: "${prompt}"
Región: ${region || 'Todas'}
Indicador: ${indicator || 'General'}
Idioma de respuesta: ${language || 'es'}

CONOCIMIENTO DE DOMINIO (usá esto para interpretar y explicar; no inventes fuera de esto):
${contexto || '(sin contexto recuperado)'}

DATOS ESTRUCTURADOS DE LA REGIÓN:
- Riesgo por región (riesgo_regiao): ${JSON.stringify(riesgo)}
- Concentración / calidad de red (tensor_concentracao): ${JSON.stringify(concentracao)}
- Antenas / cobertura (antenas_flp): ${JSON.stringify(antenas)}
    `.trim();

    const response = await callOpenRouter(userMessage);

    res.json({
      respuesta_ia: response.content,
      datos_extra: {
        regiones_riesgo: riesgo?.length ?? 0,
        antenas_encontradas: antenas?.length ?? 0,
        chunks_contexto: ragChunks.length,
      },
      fuentes: [
        'riesgo_regiao',
        'tensor_concentracao',
        'antenas_flp',
        ...new Set(ragChunks.map((c) => c.fuente)),
      ],
    });
  } catch (err) {
    next(err);
  }
}
