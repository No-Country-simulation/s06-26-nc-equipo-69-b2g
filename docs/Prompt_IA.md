# System Prompt - Agente IA App BiT

> **Fuente de la verdad (runtime):** `backend/src/ai/system-prompt.md`.
> Ese archivo ES el prompt que se inyecta al modelo (lo lee `backend/src/ai/openrouter.service.js`).
> Este documento explica el **porqué** del diseño; para cambiar el comportamiento
> de la IA, editá el archivo del módulo, no este doc.

---

## 💡 ¿Por qué está diseñado así? (Notas para el PM)

1. **Clasificación de intención primero:** antes de analizar, el prompt distingue
   un saludo / charla / meta de una consulta analítica real. Un "hola" o "¿qué podés
   hacer?" recibe una respuesta breve y conversacional (sin datos, sin viñetas),
   porque el sistema igual le inyecta los datos estructurados al contexto y sin esta
   compuerta el modelo volcaría el análisis completo ante cualquier mensaje.
2. **Evita Alucinaciones:** obliga al modelo a usar solo lo que la base de datos
   (Supabase) le pasa, evitando que invente estadísticas que arruinen la credibilidad.
3. **Genera Valor Real:** los gestores públicos no quieren leer un Excel en texto;
   quieren saber _qué hacer_ con el dato. Por eso se pide una Sugerencia Estratégica.
4. **Cercado del Dominio:** evita usar la IA para cosas fuera de contexto (recetas,
   código), lo cual gasta tokens innecesariamente.
5. **Brevedad (máx. 120 palabras):** las respuestas largas no se leen en un panel
   lateral junto al mapa. El límite fuerza a priorizar hallazgo + acción y reduce costo.
6. **Protocolo de Salida (Flujo B):** la línea final `CLUSTERS_DESTACADOS: [...]`
   permite que el frontend resalte en el mapa las regiones que la IA menciona. El
   backend la parsea, valida los nombres contra `riesgo_regiao` y la elimina del texto
   visible (`backend/src/ai/responseParser.js`).
