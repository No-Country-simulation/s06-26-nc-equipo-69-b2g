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
