import { parseAgentResponse } from '../ai/responseParser.js';

describe('parseAgentResponse', () => {
  it('extracts clusters and strips the marker line from the content', () => {
    const content =
      'La región presenta baja cobertura.\n\n**Sugerencia estratégica:** priorizar 4G.\n\nCLUSTERS_DESTACADOS: ["SANTO_AMARO", "ANTONIO_CARLOS"]';

    const result = parseAgentResponse(content);

    expect(result.clustersDestacados).toEqual(['SANTO_AMARO', 'ANTONIO_CARLOS']);
    expect(result.respuesta).toBe(
      'La región presenta baja cobertura.\n\n**Sugerencia estratégica:** priorizar 4G.'
    );
    expect(result.respuesta).not.toContain('CLUSTERS_DESTACADOS');
  });

  it('returns an empty array when the marker line is absent', () => {
    const result = parseAgentResponse('Respuesta sin marcador.');
    expect(result.clustersDestacados).toEqual([]);
    expect(result.respuesta).toBe('Respuesta sin marcador.');
  });

  it('handles an empty clusters array', () => {
    const result = parseAgentResponse('Sin regiones destacadas.\nCLUSTERS_DESTACADOS: []');
    expect(result.clustersDestacados).toEqual([]);
    expect(result.respuesta).toBe('Sin regiones destacadas.');
  });

  it('tolerates single quotes in the array', () => {
    const result = parseAgentResponse("Texto.\nCLUSTERS_DESTACADOS: ['CBD_BEIRAMAR']");
    expect(result.clustersDestacados).toEqual(['CBD_BEIRAMAR']);
  });

  it('returns empty clusters on malformed array without losing the content', () => {
    const result = parseAgentResponse('Texto.\nCLUSTERS_DESTACADOS: [not-json');
    expect(result.clustersDestacados).toEqual([]);
    expect(result.respuesta).toContain('Texto.');
  });

  it('discards non-string entries', () => {
    const result = parseAgentResponse('Texto.\nCLUSTERS_DESTACADOS: ["OK", 42, null]');
    expect(result.clustersDestacados).toEqual(['OK']);
  });

  it('handles non-string input defensively', () => {
    expect(parseAgentResponse(undefined)).toEqual({ respuesta: '', clustersDestacados: [] });
  });
});
