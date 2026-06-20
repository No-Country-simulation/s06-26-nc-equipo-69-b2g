import { callOpenRouter } from '../../ai/openrouter.service.js';
import { supabase } from '../../lib/supabase.js';

export async function queryData(req, res, next) {
  try {
    const { prompt, region, indicator, language } = req.body;

    let antenasQuery = supabase.from('antenas').select('*');
    if (region) antenasQuery = antenasQuery.eq('cluster', region);
    const { data: antenas, error: antenasError } = await antenasQuery.limit(50);

    if (antenasError) throw antenasError;

    const { data: concentracao } = await supabase
      .from('concentracao')
      .select('*')
      .limit(50);

    const userMessage = `
Consulta del usuario: "${prompt}"
Región: ${region || 'Todas'}
Indicador: ${indicator || 'General'}

Datos de antenas en la región: ${JSON.stringify(antenas)}
Datos de concentración: ${JSON.stringify(concentracao)}
    `.trim();

    const response = await callOpenRouter(userMessage);

    res.json({
      respuesta_ia: response.content,
      datos_extra: { antenas_encontradas: antenas.length },
      fuentes: ['antenas', 'concentracao'],
    });
  } catch (err) {
    next(err);
  }
}