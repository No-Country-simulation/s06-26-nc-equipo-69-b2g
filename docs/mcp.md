# MCP seguro

No commitear `mcp.json` real. El archivo local puede contener tokens o rutas privadas y esta ignorado por Git.

El MCP de Supabase usa OAuth de OpenCode, por lo que no necesita guardar la password de Postgres en el repo.

## Supabase MCP

Agregar este bloque a `~/.config/opencode/opencode.json` o usar `mcp.example.json` como referencia. Reemplazar `YOUR_SUPABASE_PROJECT_REF` por el project ref real en la config local, no en el ejemplo commiteable.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "supabase-b2g": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_SUPABASE_PROJECT_REF",
      "enabled": true
    }
  }
}
```

Luego autenticar localmente:

```bash
opencode mcp auth supabase-b2g
```

Después de modificar la configuración de OpenCode, reiniciar OpenCode para que cargue el MCP.

## Trello MCP

Trello se configura como MCP local con `atlassian-trello-mcp` y credenciales leidas desde variables de entorno. No guardar API keys ni tokens reales en `mcp.example.json`, `mcp.json` ni en archivos commiteables.

Crear las credenciales desde Trello:

1. Ir a https://trello.com/power-ups/admin y crear un Power-Up.
2. En el Power-Up, abrir la seccion API key para obtener `TRELLO_API_KEY`.
3. Desde esa pantalla, generar el token de usuario para `TRELLO_TOKEN`.

El Power-Up secret no se usa para este MCP.

Config local recomendada:

```json
{
  "mcp": {
    "trello": {
      "type": "local",
      "command": ["pnpm", "dlx", "atlassian-trello-mcp"],
      "enabled": true,
      "environment": {
        "TRELLO_API_KEY": "{env:TRELLO_API_KEY}",
        "TRELLO_TOKEN": "{env:TRELLO_TOKEN}",
        "TRELLO_READ_ONLY": "true"
      }
    }
  }
}
```

Variables requeridas:

- `TRELLO_API_KEY`: API key del Power-Up de Trello.
- `TRELLO_TOKEN`: token de usuario generado desde Trello.
- `TRELLO_READ_ONLY`: mantener en `true` por defecto para evitar escrituras accidentales.

Despues de cambiar `mcp.json` u otra config de OpenCode, reiniciar OpenCode para que cargue el MCP local con las variables de entorno disponibles.

## Checklist

- `command` es un array, no string.
- Los secretos se leen desde variables de entorno con `{env:VAR}`.
- No guardar tokens reales en el repo.
- En MCP local de OpenCode usar `environment`, no `env`.
- No cambiar CORS del backend solo para conectar MCP.
- Resetear cualquier password o token que se haya compartido por chat.
