import { callOpenRouter } from '../../ai/openrouter.service.js';
import { embedText } from '../../ai/embeddings.service.js';
import { parseAgentResponse } from '../../ai/responseParser.js';
import { isModelAllowed } from '../../ai/model.registry.js';
import { getPreferredModel } from '../models/models.service.js';
import { recallRelevant, saveTurn } from '../memory/memory.service.js';
import { supabase } from '../../lib/supabase.js';
import { logger } from '../../config/logger.js';
import { ServiceUnavailableError } from '../../utils/errors.js';

const PUBLIC_SERVICE_RADIUS_KM = 2;
const MAX_NEAREST_SERVICES_PER_ZONE = 3;

// Pure greetings/chit-chat: an optional salutation, an optional courtesy tail,
// and nothing else. Anything with real content falls through to the full
// analytical pipeline. Used to skip data/RAG context (a "hola" doesn't need 5
// queries and must not show FUENTES) and to keep greetings out of the vector
// memory, where they pollute similarity retrieval.
const SMALL_TALK_PATTERN =
  /^\s*(?:(?:hola|holis|buenas(?:\s+(?:d[ií]as|tardes|noches))?|buen\s+d[ií]a|hey|hi|hello)[\s,!.]*)?(?:(?:todo\s+bien|c[oó]mo\s+(?:est[aá]s|andas|va|anda\s+todo)|qu[eé]\s+tal|como\s+va|gracias|muchas\s+gracias|ok|dale|genial|perfecto|chau|adi[oó]s|hasta\s+luego|nos\s+vemos)[\s!.,?¿¡]*)?$/i;

function isSmallTalk(prompt) {
  const text = String(prompt).trim();
  return text.length > 0 && text.length <= 60 && SMALL_TALK_PATTERN.test(text);
}

// Body model (explicit per query) wins over the user's persisted preference;
// undefined lets callOpenRouter fall back to the server default.
async function resolveModel(bodyModel, user) {
  if (bodyModel && isModelAllowed(bodyModel)) return bodyModel;
  if (user) return (await getPreferredModel(user.id)) ?? undefined;
  return undefined;
}

// The visible transcript the frontend sends for intra-session continuity.
// Untrusted input: keep only well-formed turns, cap count and length.
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS = 600;

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (turn) =>
        turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string' &&
        turn.content.trim()
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.trim().slice(0, MAX_HISTORY_CHARS) }));
}

function conversationBlock(sessionHistory) {
  if (sessionHistory.length === 0) return '';
  return `CONVERSACIÓN ACTUAL (turnos previos de esta misma sesión; usalos para dar continuidad natural — nombre del usuario, referencias como "esa zona", seguimiento — NO como fuente de datos duros):
${sessionHistory.map((turn) => `[${turn.role}] ${turn.content}`).join('\n')}

`;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function haversineKm(origin, target) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(target.lat - origin.lat);
  const dLon = toRadians(target.lon - origin.lon);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(target.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getZonePoint(zone, antenas = []) {
  const zoneLat = toNumber(
    zone?.lat ?? zone?.latitude ?? zone?.centroide_lat ?? zone?.centroid_lat
  );
  const zoneLon = toNumber(
    zone?.lon ?? zone?.lng ?? zone?.longitude ?? zone?.centroide_lon ?? zone?.centroid_lon
  );

  if (zoneLat !== null && zoneLon !== null) return { lat: zoneLat, lon: zoneLon };

  const zoneAntennas = antenas
    .filter((antena) => antena.cluster === zone?.cluster)
    .map((antena) => ({ lat: toNumber(antena.lat), lon: toNumber(antena.lon) }))
    .filter((point) => point.lat !== null && point.lon !== null);

  if (zoneAntennas.length === 0) return null;

  return {
    lat: zoneAntennas.reduce((sum, point) => sum + point.lat, 0) / zoneAntennas.length,
    lon: zoneAntennas.reduce((sum, point) => sum + point.lon, 0) / zoneAntennas.length,
  };
}

function summarizeNearbyPublicServices(zones, services, antenas) {
  const validServices = (services ?? [])
    .map((service) => ({ ...service, lat: toNumber(service.lat), lon: toNumber(service.lon) }))
    .filter((service) => service.lat !== null && service.lon !== null);

  if (!Array.isArray(zones) || zones.length === 0 || validServices.length === 0) {
    return { summaryText: '', totalNearby: 0 };
  }

  const zoneSummaries = zones
    .map((zone) => {
      const point = getZonePoint(zone, antenas);
      if (!point) return null;

      const nearby = validServices
        .map((service) => ({
          ...service,
          distanceKm: haversineKm(point, { lat: service.lat, lon: service.lon }),
        }))
        .filter((service) => service.distanceKm <= PUBLIC_SERVICE_RADIUS_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      if (nearby.length === 0) return null;

      const countsByCategory = nearby.reduce((counts, service) => {
        const category = service.categoria || 'otro';
        counts[category] = (counts[category] ?? 0) + 1;
        return counts;
      }, {});

      const examples = nearby.slice(0, MAX_NEAREST_SERVICES_PER_ZONE).map((service) => ({
        nome: service.nome || service.tipo || 'servicio público',
        tipo: service.tipo || 'desconocido',
        categoria: service.categoria || 'otro',
        distancia_km: Number(service.distanceKm.toFixed(2)),
      }));

      return {
        zona: zone.cluster,
        total: nearby.length,
        categorias: countsByCategory,
        ejemplos_cercanos: examples,
      };
    })
    .filter(Boolean);

  const totalNearby = zoneSummaries.reduce((sum, zone) => sum + zone.total, 0);

  return {
    summaryText:
      zoneSummaries.length > 0
        ? `\n- Servicios públicos cercanos (radio ${PUBLIC_SERVICE_RADIUS_KM} km por zona; usalos como contexto territorial, no como impacto sectorial medido): ${JSON.stringify(zoneSummaries)}`
        : '',
    totalNearby,
  };
}

export async function queryData(req, res, next) {
  try {
    const { prompt, region, regions, ecgi, indicator, language, model, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const resolvedModel = await resolveModel(model, req.user);
    const sessionHistory = sanitizeHistory(history);

    // Small-talk fast path: a greeting needs no data, no RAG and no FUENTES
    // chips in the UI. Answering conversationally (system prompt SALUDO rule)
    // also keeps the reply varied instead of a canned data-flavored line.
    if (isSmallTalk(prompt)) {
      try {
        const response = await callOpenRouter(
          `${conversationBlock(sessionHistory)}Consulta del usuario: "${prompt}"\nIdioma de respuesta: ${language || 'es'}\n(Es un saludo o charla: respondé según la regla de SALUDO, sin datos.)`,
          resolvedModel
        );
        const parsedResponse = parseAgentResponse(response?.content);
        if (!parsedResponse.respuesta) {
          throw new Error('OpenRouter returned empty or invalid content');
        }
        return res.json({
          respuesta_ia: parsedResponse.respuesta,
          clusters_destacados: [],
          datos_extra: {
            regiones_riesgo: 0,
            antenas_encontradas: 0,
            chunks_contexto: 0,
            equipamentos_publicos: 0,
          },
          fuentes: [],
        });
      } catch (aiError) {
        logger.error({ err: aiError }, 'AI provider call failed');
        throw new ServiceUnavailableError(`AI provider call failed: ${aiError.message}`);
      }
    }

    // Per-user memory (only when authenticated via optionalAuth). Failures
    // must never block the answer, so recall degrades to [].
    const historial = req.user ? await recallRelevant(req.user.id, prompt) : [];

    const selectedRegions = Array.isArray(regions) ? [...new Set(regions.filter(Boolean))] : [];
    const hasMultipleRegions = selectedRegions.length > 1;

    // 1) Datos estructurados agregados (tablas con public read).
    //    riesgo_regiao es la salida principal del producto (score por cluster).
    let riesgoQuery = supabase.from('riesgo_regiao').select('*');
    if (selectedRegions.length > 0) riesgoQuery = riesgoQuery.in('cluster', selectedRegions);
    else if (region) riesgoQuery = riesgoQuery.eq('cluster', region);
    const { data: riesgo, error: riesgoError } = await riesgoQuery.limit(50);
    if (riesgoError) throw riesgoError;

    let concQuery = supabase
      .from('tensor_concentracao')
      .select(
        'ecgi, cluster, periodo, n_usuarios, drop_pct_medio, congestionamento_medio, download_bytes, lat, lon'
      );
    // ecgi (click en antena) es más específico que region (click en cluster).
    if (ecgi) concQuery = concQuery.eq('ecgi', ecgi);
    else if (selectedRegions.length > 0) concQuery = concQuery.in('cluster', selectedRegions);
    else if (region) concQuery = concQuery.eq('cluster', region);
    const { data: concentracao, error: concError } = await concQuery.limit(50);
    if (concError) throw concError;

    let antenasQuery = supabase.from('antenas_flp').select('ecgi, cluster, municipio, lat, lon');
    if (selectedRegions.length > 0) antenasQuery = antenasQuery.in('cluster', selectedRegions);
    else if (region) antenasQuery = antenasQuery.eq('cluster', region);
    const { data: antenas, error: antenasError } = await antenasQuery.limit(50);
    if (antenasError) throw antenasError;

    // 1a) Equipamientos públicos cercanos para orientar recomendaciones de política.
    //     Si la tabla aún no existe o falla la consulta, el endpoint debe seguir funcionando.
    let equipamentosPublicos = [];
    try {
      const { data: equipamentosData, error: equipamentosError } = await supabase
        .from('equipamentos_publicos')
        .select('nome,tipo,categoria,lat,lon')
        .limit(5000);
      if (!equipamentosError && Array.isArray(equipamentosData))
        equipamentosPublicos = equipamentosData;
    } catch {
      equipamentosPublicos = [];
    }

    const publicServicesContext = summarizeNearbyPublicServices(
      riesgo ?? [],
      equipamentosPublicos,
      antenas ?? []
    );

    // 1c) Perfil demográfico por zona (assinantes agregada server-side).
    //     Solo con zonas seleccionadas: el agregado completo es innecesario para el prompt.
    let demografia = [];
    const demographicRegions =
      selectedRegions.length > 0 ? selectedRegions : region ? [region] : [];
    if (demographicRegions.length > 0) {
      demografia = (
        await Promise.all(
          demographicRegions.map(async (cluster) => {
            const { data: perfil, error: perfilError } = await supabase.rpc('mapa_demografia', {
              p_cluster: cluster,
            });
            if (!perfilError && Array.isArray(perfil) && perfil.length > 0) return perfil[0];
            return null;
          })
        )
      ).filter(Boolean);
    }

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
Zona principal: ${region || selectedRegions[0] || 'Todas'}
Zonas seleccionadas: ${selectedRegions.length > 0 ? selectedRegions.join(', ') : region || 'Todas'}
Antena (ecgi): ${ecgi || 'Todas'}
Indicador: ${indicator || 'General'}
Idioma de respuesta: ${language || 'es'}
Estilo de salida: usá siempre "zona" para el usuario; no uses la palabra "cluster" en la respuesta visible.
${hasMultipleRegions ? 'Instrucción: compará explícitamente todas las zonas seleccionadas usando los datos suministrados para cada una.' : ''}

${conversationBlock(sessionHistory)}${
      historial.length > 0
        ? `HISTORIAL DEL USUARIO (conversaciones previas de ESTA persona; usalo para dar
continuidad y personalizar el tono, NO como fuente de datos duros):
${historial.map((t) => `[${t.role}] ${t.content}`).join('\n')}

`
        : ''
    }CONOCIMIENTO DE DOMINIO (usá esto para interpretar y explicar; no inventes fuera de esto):
${contexto || '(sin contexto recuperado)'}

DATOS ESTRUCTURADOS DE LAS ZONAS:
- Riesgo por zona (riesgo_regiao): ${JSON.stringify(riesgo)}
- Concentración / calidad de red (tensor_concentracao): ${JSON.stringify(concentracao)}
- Antenas / cobertura (antenas_flp): ${JSON.stringify(antenas)}${
      publicServicesContext.summaryText
    }${
      demografia.length > 0
        ? `\n- Perfil demográfico por zona (assinantes agregado): ${JSON.stringify(demografia)}`
        : ''
    }
    `.trim();

    // Sin fallback: si el proveedor de IA falla, propagamos el error real para
    // poder diagnosticarlo (logs + response), en vez de devolver una respuesta
    // genérica que enmascara el problema.
    let respuesta;
    let clustersDestacados;
    try {
      const response = await callOpenRouter(userMessage, resolvedModel);
      const parsedResponse = parseAgentResponse(response?.content);

      if (!parsedResponse.respuesta) {
        throw new Error('OpenRouter returned empty or invalid content');
      }

      respuesta = parsedResponse.respuesta;
      clustersDestacados = parsedResponse.clustersDestacados;
    } catch (aiError) {
      logger.error({ err: aiError }, 'AI provider call failed');
      throw new ServiceUnavailableError(`AI provider call failed: ${aiError.message}`);
    }

    // Flujo B (chat -> mapa): only clusters that exist in riesgo_regiao reach
    // the frontend, so a hallucinated name never breaks the map highlight.
    let validClusters = new Set((riesgo ?? []).map((r) => r.cluster));
    if ((region || selectedRegions.length > 0) && clustersDestacados.length > 0) {
      const { data: allClusters } = await supabase
        .from('riesgo_regiao')
        .select('cluster')
        .limit(50);
      if (allClusters?.length) validClusters = new Set(allClusters.map((r) => r.cluster));
    }

    res.json({
      respuesta_ia: respuesta,
      clusters_destacados: clustersDestacados.filter((c) => validClusters.has(c)),
      datos_extra: {
        regiones_riesgo: riesgo?.length ?? 0,
        antenas_encontradas: antenas?.length ?? 0,
        chunks_contexto: ragChunks.length,
        equipamentos_publicos: publicServicesContext.totalNearby,
      },
      fuentes: [
        'riesgo_regiao',
        'tensor_concentracao',
        'antenas_flp',
        ...(publicServicesContext.totalNearby > 0 ? ['equipamentos_publicos'] : []),
        ...(demografia.length > 0 ? ['assinantes_agregado'] : []),
        ...new Set(ragChunks.map((c) => c.fuente)),
      ],
    });

    // Persist the turn AFTER answering (fire-and-forget): memory writes add
    // an embedding call + 2 inserts and must not raise chat latency.
    if (req.user && !isSmallTalk(prompt)) {
      const meta = { regions: selectedRegions, ecgi: ecgi ?? null, model: resolvedModel ?? null };
      saveTurn(req.user.id, 'user', prompt, meta).catch((err) =>
        logger.warn({ err }, 'saveTurn(user) failed')
      );
      saveTurn(req.user.id, 'assistant', respuesta, {
        clusters_destacados: clustersDestacados,
      }).catch((err) => logger.warn({ err }, 'saveTurn(assistant) failed'));
    }
  } catch (err) {
    next(err);
  }
}
