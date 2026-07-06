import { supabase } from '../../lib/supabase.js';
import {
  clustersToGeoJson,
  concentracaoToGeoJson,
  equipamentosToGeoJson,
  odToGeoJson,
  demografiaToResponse,
} from './mapa.transformers.js';

const PERIODOS = ['MADRUGADA', 'MANHA', 'TARDE', 'NOITE'];
const CATEGORIAS_EQUIPAMENTOS = ['salud', 'educacion', 'asistencia', 'gobierno'];

// tensor_od has ~506 inter-cluster rows; cap keeps the payload bounded if data grows.
const OD_MAX_FEATURES = 500;

export async function getClusters(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('riesgo_regiao')
      .select('*')
      .order('score_riesgo', { ascending: false })
      .limit(50);
    if (error) throw error;

    res.json(clustersToGeoJson(data ?? []));
  } catch (err) {
    next(err);
  }
}

export async function getConcentracao(req, res, next) {
  try {
    const periodo = String(req.query.periodo ?? 'MANHA').toUpperCase();
    if (!PERIODOS.includes(periodo)) {
      return res.status(400).json({
        error: `periodo must be one of: ${PERIODOS.join(', ')}`,
      });
    }

    // Aggregated in Postgres (RPC with GROUP BY) — never expose raw tensor rows.
    const { data, error } = await supabase.rpc('mapa_concentracao', { p_periodo: periodo });
    if (error) throw error;

    res.json(concentracaoToGeoJson(data ?? [], periodo));
  } catch (err) {
    next(err);
  }
}

export async function getEquipamentos(req, res, next) {
  try {
    const categoria = req.query.categoria ? String(req.query.categoria).toLowerCase() : null;

    if (categoria && !CATEGORIAS_EQUIPAMENTOS.includes(categoria)) {
      return res.status(400).json({
        error: `categoria debe ser una de: ${CATEGORIAS_EQUIPAMENTOS.join(', ')}`,
      });
    }

    let query = supabase
      .from('equipamentos_publicos')
      .select('nome, tipo, categoria, source, source_id, lat, lon')
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true });

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(equipamentosToGeoJson(data ?? []));
  } catch (err) {
    next(err);
  }
}

export async function getOd(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('tensor_od')
      .select(
        'cluster_origem, municipio_origem, lat_origem, lon_origem, cluster_destino, municipio_destino, lat_destino, lon_destino, n_usuarios, n_viagens, dist_media_km, periodo_predominante'
      )
      .eq('mesmo_cluster', 0)
      .order('n_viagens', { ascending: false })
      .limit(OD_MAX_FEATURES);
    if (error) throw error;

    res.json(odToGeoJson(data ?? []));
  } catch (err) {
    next(err);
  }
}

export async function getDemografia(_req, res, next) {
  try {
    // Aggregated in Postgres (GROUP BY home_cluster) — assinantes rows are
    // individual subscriber data and must never reach the frontend raw.
    const { data, error } = await supabase.rpc('mapa_demografia', { p_cluster: null });
    if (error) throw error;

    res.json(demografiaToResponse(data ?? []));
  } catch (err) {
    next(err);
  }
}
