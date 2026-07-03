const responseCatalog = [
  {
    keywords: ['prioridad', 'priorizar', 'region', 'región', 'territorio'],
    response:
      'Para priorizar un territorio en modo demo, miraría tres señales juntas: concentración de población, brechas de conectividad y acceso a servicios públicos. Con datos reales, esa regla debería validarse con fuentes oficiales y criterios del equipo técnico.',
  },
  {
    keywords: ['exclusion', 'exclusión', 'digital', 'conectividad', 'red'],
    response:
      'Una lectura útil de inclusión digital combina cobertura, calidad percibida, disponibilidad de equipamiento y cercanía a puntos de atención. Esta demo no consulta una base real, pero muestra cómo podría explicarse el análisis.',
  },
  {
    keywords: ['datos', 'publicos', 'públicos', 'fuente', 'fuentes'],
    response:
      'Para datos públicos territoriales conviene separar fuente, período, nivel de agregación y limitaciones. La respuesta final debería decir qué datos usó y qué NO puede concluir con confianza.',
  },
  {
    keywords: ['preguntar', 'preguntarte', 'ayuda'],
    response:
      'Podés preguntar cosas como: “¿Qué señales revisarías para priorizar una zona?”, “¿Cómo explicarías una brecha de conectividad?” o “¿Qué datos públicos servirían para validar esta hipótesis?”.',
  },
]

const defaultResponse =
  'En esta demo puedo orientar el análisis con criterios generales sobre territorio, conectividad, inclusión digital y datos públicos agregados. Todavía no consulto un backend ni datos en tiempo real, así que tomaría esta respuesta como guía conceptual.'

export function getDemoAiResponse(message) {
  const normalizedMessage = message.toLocaleLowerCase('es')
  const match = responseCatalog.find(({ keywords }) =>
    keywords.some((keyword) => normalizedMessage.includes(keyword)),
  )

  return match?.response ?? defaultResponse
}
