/**
 * mockCobertura4G.js
 * Cobertura 4G LTE por celda H3 resolución 8 (~0.74 km²)
 * Fuente simulada: CDRView jun/2026 + modelo ANATEL
 *
 * Campos:
 *  cellId       — ID H3 (simulado, formato hex-like)
 *  lat / lng    — centroide de la celda
 *  clusterId    — cluster CDRView al que pertenece
 *  cobertura    — % celdas con señal ≥ –100 dBm (0–100)
 *  rsrpMedio    — Reference Signal Received Power promedio (dBm)
 *  sinrMedio    — Signal-to-Interference-Noise Ratio promedio (dB)
 *  velocidadDl  — throughput estimado downlink (Mbps)
 *  velocidadUl  — throughput estimado uplink (Mbps)
 *  congestion   — índice de congestión (0–100, mayor = más congestionado)
 *  nivelSeq     — nivel secuencial visual 1–5 (para escala de color del mapa)
 *  timestamp    — período del dataset
 */

export const cobertura4G = [
  // ── CL-01 · Centro — alta demanda, señal buena pero congestión alta ──
  {
    cellId: '88a8e30b03fffff',
    lat: -27.5969, lng: -48.5495,
    clusterId: 'CL-01',
    cobertura: 97,
    rsrpMedio: -82,
    sinrMedio: 14.2,
    velocidadDl: 38.4,
    velocidadUl: 12.1,
    congestion: 78,
    nivelSeq: 5,
    timestamp: '2026-06-15T00:00:00Z',
  },
  {
    cellId: '88a8e30b07fffff',
    lat: -27.5952, lng: -48.5512,
    clusterId: 'CL-01',
    cobertura: 95,
    rsrpMedio: -85,
    sinrMedio: 12.8,
    velocidadDl: 31.2,
    velocidadUl: 10.4,
    congestion: 82,
    nivelSeq: 5,
    timestamp: '2026-06-15T00:00:00Z',
  },
  {
    cellId: '88a8e30b09fffff',
    lat: -27.5983, lng: -48.5473,
    clusterId: 'CL-01',
    cobertura: 91,
    rsrpMedio: -88,
    sinrMedio: 10.5,
    velocidadDl: 24.7,
    velocidadUl: 8.2,
    congestion: 71,
    nivelSeq: 4,
    timestamp: '2026-06-15T00:00:00Z',
  },

  // ── CL-02 · Trindade — señal media, universitario ────────
  {
    cellId: '88a8e30c01fffff',
    lat: -27.6012, lng: -48.5198,
    clusterId: 'CL-02',
    cobertura: 88,
    rsrpMedio: -91,
    sinrMedio: 9.1,
    velocidadDl: 22.3,
    velocidadUl: 7.6,
    congestion: 65,
    nivelSeq: 4,
    timestamp: '2026-06-15T00:00:00Z',
  },
  {
    cellId: '88a8e30c03fffff',
    lat: -27.6035, lng: -48.5223,
    clusterId: 'CL-02',
    cobertura: 84,
    rsrpMedio: -93,
    sinrMedio: 8.4,
    velocidadDl: 18.9,
    velocidadUl: 6.3,
    congestion: 58,
    nivelSeq: 3,
    timestamp: '2026-06-15T00:00:00Z',
  },
  {
    cellId: '88a8e30c05fffff',
    lat: -27.5999, lng: -48.5242,
    clusterId: 'CL-02',
    cobertura: 79,
    rsrpMedio: -97,
    sinrMedio: 6.7,
    velocidadDl: 14.1,
    velocidadUl: 4.8,
    congestion: 44,
    nivelSeq: 3,
    timestamp: '2026-06-15T00:00:00Z',
  },

  // ── CL-03 · Agronômica — cobertura media-baja ────────────
  {
    cellId: '88a8e30d01fffff',
    lat: -27.5878, lng: -48.5356,
    clusterId: 'CL-03',
    cobertura: 72,
    rsrpMedio: -101,
    sinrMedio: 5.2,
    velocidadDl: 11.4,
    velocidadUl: 3.9,
    congestion: 38,
    nivelSeq: 2,
    timestamp: '2026-06-15T00:00:00Z',
  },
  {
    cellId: '88a8e30d03fffff',
    lat: -27.5901, lng: -48.5335,
    clusterId: 'CL-03',
    cobertura: 68,
    rsrpMedio: -104,
    sinrMedio: 4.1,
    velocidadDl: 9.2,
    velocidadUl: 3.1,
    congestion: 32,
    nivelSeq: 2,
    timestamp: '2026-06-15T00:00:00Z',
  },

  // ── CL-04 · Lagoa da Conceição — cobertura baja ──────────
  {
    cellId: '88a8e30e01fffff',
    lat: -27.5997, lng: -48.4701,
    clusterId: 'CL-04',
    cobertura: 54,
    rsrpMedio: -108,
    sinrMedio: 2.8,
    velocidadDl: 6.7,
    velocidadUl: 2.2,
    congestion: 21,
    nivelSeq: 1,
    timestamp: '2026-06-15T00:00:00Z',
  },
  {
    cellId: '88a8e30e03fffff',
    lat: -27.6022, lng: -48.4679,
    clusterId: 'CL-04',
    cobertura: 48,
    rsrpMedio: -111,
    sinrMedio: 1.9,
    velocidadDl: 4.3,
    velocidadUl: 1.6,
    congestion: 15,
    nivelSeq: 1,
    timestamp: '2026-06-15T00:00:00Z',
  },

  // ── CL-05 · Ingleses — alta cobertura, baja congestión ───
  {
    cellId: '88a8e30f01fffff',
    lat: -27.4402, lng: -48.3985,
    clusterId: 'CL-05',
    cobertura: 93,
    rsrpMedio: -84,
    sinrMedio: 13.6,
    velocidadDl: 41.2,
    velocidadUl: 14.3,
    congestion: 29,
    nivelSeq: 5,
    timestamp: '2026-06-15T00:00:00Z',
  },
  {
    cellId: '88a8e30f03fffff',
    lat: -27.4421, lng: -48.3963,
    clusterId: 'CL-05',
    cobertura: 89,
    rsrpMedio: -87,
    sinrMedio: 11.4,
    velocidadDl: 35.8,
    velocidadUl: 11.9,
    congestion: 24,
    nivelSeq: 4,
    timestamp: '2026-06-15T00:00:00Z',
  },
]

/**
 * Helper: devuelve el color de cobertura según nivel secuencial (1–5)
 * Usa los tokens --seq-N del Design System BiT (marca violeta)
 */
export const coberturaColorMap = {
  1: 'var(--seq-1)',   // muy baja
  2: 'var(--seq-2)',   // baja
  3: 'var(--seq-3)',   // media
  4: 'var(--seq-4)',   // alta
  5: 'var(--seq-5)',   // muy alta
}

/**
 * Helper: etiqueta legible del nivel
 */
export const coberturaNivelLabel = {
  1: 'Muy baja',
  2: 'Baja',
  3: 'Media',
  4: 'Alta',
  5: 'Muy alta',
}
