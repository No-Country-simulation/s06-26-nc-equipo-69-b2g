import { callOpenRouter } from '../../ai/openrouter.service.js';
import { embedText } from '../../ai/embeddings.service.js';
import { parseAgentResponse } from '../../ai/responseParser.js';
import { supabase } from '../../lib/supabase.js';

const PUBLIC_SERVICE_RADIUS_KM = 2;
const MAX_NEAREST_SERVICES_PER_ZONE = 3;

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

function deriveHighlightedZonesFromRisk(riesgo) {
  if (!Array.isArray(riesgo)) return [];

  return riesgo
    .filter((zone) => typeof zone?.cluster === 'string' && zone.cluster.length > 0)
    .map((zone, index) => ({
      cluster: zone.cluster,
      score: toNumber(zone.score_riesgo),
      index,
    }))
    .sort((a, b) => {
      if (a.score !== null && b.score !== null) return b.score - a.score;
      if (a.score !== null) return -1;
      if (b.score !== null) return 1;
      return a.index - b.index;
    })
    .slice(0, 5)
    .map((zone) => zone.cluster);
}

function formatZoneName(zone) {
  return String(zone).replace(/_/g, ' ');
}

function buildStructuredFallbackAnswer({ riesgo, concentracao, antenas, publicServicesContext }) {
  const highlightedZones = deriveHighlightedZonesFromRisk(riesgo);
  const riskSummary = highlightedZones.length
    ? `Zonas a priorizar según los datos de riesgo disponibles: ${highlightedZones
        .map(formatZoneName)
        .join(', ')}.`
    : 'No hay una zona destacada con los datos de riesgo disponibles en esta consulta.';

  const connectivitySummary =
    (concentracao?.length ?? 0) > 0 || (antenas?.length ?? 0) > 0
      ? 'Primero conviene revisar conectividad: cobertura, congestión, caídas y capacidad de antenas en las zonas consultadas.'
      : 'Primero conviene revisar conectividad y validar cobertura, congestión y caídas con datos operativos actualizados.';

  const publicServicesSummary =
    publicServicesContext.totalNearby > 0
      ? 'Además, los datos incluyen servicios públicos e instituciones cercanas; usalos como contexto territorial para coordinar acciones, sin asumir que por sí solos cambian los resultados de conectividad.'
      : 'No se detectó contexto cercano de servicios públicos para esta consulta, así que las recomendaciones deben apoyarse principalmente en los indicadores de red y riesgo.';

  return {
    respuesta: `${connectivitySummary} ${riskSummary} ${publicServicesSummary}`,
    clustersDestacados: highlightedZones,
  };
}

export async function queryData(req, res, next) {
  try {
    const { prompt, region, regions, ecgi, indicator, language } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

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

CONOCIMIENTO DE DOMINIO (usá esto para interpretar y explicar; no inventes fuera de esto):
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

    let respuesta;
    let clustersDestacados;
    try {
      const response = await callOpenRouter(userMessage);
      const parsedResponse = parseAgentResponse(response?.content);

      if (!parsedResponse.respuesta) {
        throw new Error('OpenRouter returned empty or invalid content');
      }

      respuesta = parsedResponse.respuesta;
      clustersDestacados = parsedResponse.clustersDestacados;
    } catch {
      const fallback = buildStructuredFallbackAnswer({
        riesgo,
        concentracao,
        antenas,
        publicServicesContext,
      });
      respuesta = fallback.respuesta;
      clustersDestacados = fallback.clustersDestacados;
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
  } catch (err) {
    next(err);
  }
}
