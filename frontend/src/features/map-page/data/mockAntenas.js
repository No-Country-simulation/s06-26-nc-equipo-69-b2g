/**
 * mockAntenas.js
 * Antenas ERB (Estações Rádio Base) — Florianópolis, SC
 * Fuente simulada: ANATEL ERBS Q4-2025
 *
 * Campos:
 *  id         — identificador único
 *  lat / lng  — coordenadas WGS84
 *  operadora  — Claro | Vivo | TIM | Oi
 *  tecnologia — 4G LTE | 5G NR | 4G+5G
 *  frequencia — banda principal (MHz)
 *  potencia   — EIRP estimada (dBm)
 *  azimute    — orientación del sector (°)
 *  sectores   — número de sectores activos
 *  estado     — activa | mantenimiento | baja
 *  clusterId  — cluster CDRView al que pertenece
 */

export const antenas = [
  // ── Cluster CL-01 · Centro ──────────────────────────────
  {
    id: 'ERB-001',
    lat: -27.5969,
    lng: -48.5495,
    operadora: 'Claro',
    tecnologia: '4G+5G',
    frequencia: 700,
    potencia: 52.4,
    azimute: 0,
    sectores: 3,
    estado: 'activa',
    clusterId: 'CL-01',
  },
  {
    id: 'ERB-002',
    lat: -27.5945,
    lng: -48.5511,
    operadora: 'Vivo',
    tecnologia: '4G LTE',
    frequencia: 1800,
    potencia: 48.1,
    azimute: 120,
    sectores: 3,
    estado: 'activa',
    clusterId: 'CL-01',
  },
  {
    id: 'ERB-003',
    lat: -27.5982,
    lng: -48.5472,
    operadora: 'TIM',
    tecnologia: '4G LTE',
    frequencia: 2600,
    potencia: 45.8,
    azimute: 240,
    sectores: 2,
    estado: 'mantenimiento',
    clusterId: 'CL-01',
  },

  // ── Cluster CL-02 · Trindade ─────────────────────────────
  {
    id: 'ERB-004',
    lat: -27.6012,
    lng: -48.5198,
    operadora: 'Claro',
    tecnologia: '4G LTE',
    frequencia: 850,
    potencia: 50.0,
    azimute: 60,
    sectores: 3,
    estado: 'activa',
    clusterId: 'CL-02',
  },
  {
    id: 'ERB-005',
    lat: -27.6034,
    lng: -48.5224,
    operadora: 'TIM',
    tecnologia: '4G+5G',
    frequencia: 700,
    potencia: 53.2,
    azimute: 180,
    sectores: 3,
    estado: 'activa',
    clusterId: 'CL-02',
  },
  {
    id: 'ERB-006',
    lat: -27.5998,
    lng: -48.5241,
    operadora: 'Vivo',
    tecnologia: '4G LTE',
    frequencia: 1800,
    potencia: 46.5,
    azimute: 300,
    sectores: 2,
    estado: 'activa',
    clusterId: 'CL-02',
  },

  // ── Cluster CL-03 · Agronômica ───────────────────────────
  {
    id: 'ERB-007',
    lat: -27.5878,
    lng: -48.5356,
    operadora: 'Oi',
    tecnologia: '4G LTE',
    frequencia: 2100,
    potencia: 44.3,
    azimute: 90,
    sectores: 2,
    estado: 'activa',
    clusterId: 'CL-03',
  },
  {
    id: 'ERB-008',
    lat: -27.5901,
    lng: -48.5334,
    operadora: 'Claro',
    tecnologia: '4G LTE',
    frequencia: 850,
    potencia: 49.7,
    azimute: 210,
    sectores: 3,
    estado: 'activa',
    clusterId: 'CL-03',
  },

  // ── Cluster CL-04 · Lagoa da Conceição ──────────────────
  {
    id: 'ERB-009',
    lat: -27.5997,
    lng: -48.4701,
    operadora: 'Vivo',
    tecnologia: '4G LTE',
    frequencia: 1800,
    potencia: 47.9,
    azimute: 0,
    sectores: 2,
    estado: 'activa',
    clusterId: 'CL-04',
  },
  {
    id: 'ERB-010',
    lat: -27.6021,
    lng: -48.4678,
    operadora: 'TIM',
    tecnologia: '4G LTE',
    frequencia: 2600,
    potencia: 43.6,
    azimute: 180,
    sectores: 2,
    estado: 'baja',
    clusterId: 'CL-04',
  },

  // ── Cluster CL-05 · Ingleses do Rio Vermelho ─────────────
  {
    id: 'ERB-011',
    lat: -27.4402,
    lng: -48.3985,
    operadora: 'Claro',
    tecnologia: '4G+5G',
    frequencia: 700,
    potencia: 54.1,
    azimute: 120,
    sectores: 3,
    estado: 'activa',
    clusterId: 'CL-05',
  },
  {
    id: 'ERB-012',
    lat: -27.4421,
    lng: -48.3962,
    operadora: 'Vivo',
    tecnologia: '4G LTE',
    frequencia: 850,
    potencia: 50.8,
    azimute: 240,
    sectores: 3,
    estado: 'activa',
    clusterId: 'CL-05',
  },
]
