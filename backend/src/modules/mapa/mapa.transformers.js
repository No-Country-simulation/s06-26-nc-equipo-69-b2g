// Pure transformers: DB rows -> GeoJSON FeatureCollection.
// Coordinates always in Mapbox order: [lon, lat].

function pointFeature(lon, lat, properties) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties,
  };
}

export function clustersToGeoJson(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.map(({ lat, lon, updated_at: _updatedAt, ...properties }) =>
      pointFeature(lon, lat, properties)
    ),
  };
}

export function concentracaoToGeoJson(rows, periodo) {
  return {
    type: 'FeatureCollection',
    metadata: { periodo },
    features: rows.map(({ lat, lon, ...properties }) => pointFeature(lon, lat, properties)),
  };
}

export function odToGeoJson(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.map(({ lat_origem, lon_origem, lat_destino, lon_destino, ...properties }) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [lon_origem, lat_origem],
          [lon_destino, lat_destino],
        ],
      },
      properties,
    })),
  };
}

// Not GeoJSON: demographic profiles are popup/context data, keyed by cluster
// so the frontend resolves a map click without scanning an array.
export function demografiaToResponse(rows) {
  const clusters = {};
  let totalAssinantes = 0;

  for (const { cluster, ...profile } of rows) {
    clusters[cluster] = profile;
    totalAssinantes += profile.n_assinantes ?? 0;
  }

  return {
    metadata: { total_assinantes: totalAssinantes, n_clusters: rows.length },
    clusters,
  };
}
