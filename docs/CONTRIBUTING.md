# Guía de Contribución

Gracias por querer contribuir a este proyecto. Para mantener el código limpio y organizado, seguí estas reglas.

## Convenciones del equipo

| Tema            | Regla                                                                |
| --------------- | -------------------------------------------------------------------- |
| Branches        | `<type>/<issue-id>-descripcion-corta`, ej. `feat/42-agregar-login`   |
| Issues y PRs    | `type(scope): descripcion corta`                                     |
| PRs             | Deben cerrar un issue aprobado con `Closes #ID` antes de mergear     |
| Commits         | Conventional Commits, ej. `feat(auth): agregar login con Supabase`   |
| Labels de issue | Un `type:*`, un `status:*`, un `priority:*` y opcionalmente `area:*` |
| Paquetes        | Usar `pnpm`; no usar `npm`, `npx` ni `yarn`                          |

## Estrategia de Ramas (Branching)

No se permite hacer push directamente a `main`. Todas las contribuciones deben realizarse mediante **ramas de trabajo**.

### Formato de nombres de rama

Usá `<type>/<issue-id>-descripcion-corta`.

Ejemplos:

- `feat/42-agregar-login`
- `fix/57-corregir-validacion-fechas`
- `docs/61-actualizar-readme`
- `refactor/73-extraer-servicio-auth`
- `chore/88-ajustar-tooling`

## Flujo de Trabajo (Workflow)

### 1. Sincronizar

Asegurate de tener la última versión de `main`:

```bash
git checkout main
git pull origin main
```

### 2. Crear una rama

```bash
git checkout -b feat/42-agregar-login
```

### 3. Desarrollar

Escribí tu código siguiendo los estándares definidos para el proyecto. Instalá y ejecutá comandos desde la raíz con `pnpm`.

Comandos útiles desde la raíz:

```bash
pnpm dev:frontend
pnpm dev:backend
pnpm dev:local
```

### 4. Commit

Utilizá la convención de commits definida en la siguiente sección.

### 5. Pull Request

Subí tu rama al repositorio remoto y abrí un Pull Request hacia `main` utilizando la plantilla correspondiente. El PR debe vincular y cerrar un issue aprobado con `Closes #ID`.

## Convención de Commits (Conventional Commits)

### Formato

```text
<tipo>(<scope>): <descripción>
```

### Tipos

| Tipo       | Descripción                                                    |
| ---------- | -------------------------------------------------------------- |
| `feat`     | Nueva funcionalidad                                            |
| `fix`      | Corrección de error                                            |
| `docs`     | Cambios en documentación                                       |
| `refactor` | Cambio de código sin agregar funcionalidad ni corregir errores |
| `test`     | Agregar o modificar tests                                      |
| `chore`    | Cambios en build, tooling o dependencias                       |
| `ci`       | Cambios en integración continua                                |
| `perf`     | Mejoras de rendimiento                                         |

### Scope (opcional)

Ejemplos:

- `backend`
- `frontend`
- `api`
- `docs`
- `config`

### Descripción

La descripción debe:

- Estar escrita en español.
- Utilizar modo imperativo.
- No comenzar con mayúscula.
- No finalizar con punto.

### Ejemplos

```text
feat(backend): agregar endpoint de consulta
fix(api): corregir validación de fechas
docs(readme): actualizar instrucciones de instalación
refactor: extraer lógica a módulo separado
chore: actualizar dependencias
```

## Labels de issues

Todo issue debe tener:

- Un label `type:*`.
- Un label `status:*`.
- Un label `priority:*`.
- Un label `area:*` cuando aplique.

## Template para Pull Requests

Cada Pull Request debe usar la plantilla del repositorio e incluir:

- Issue vinculado con `Closes #ID`.
- Resumen claro del cambio.
- Evidencia de verificación.
- Checklist completo.

## Validación local

Ejecutá desde la raíz cuando aplique:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

## Base de datos local

Usá Supabase CLI desde la raíz para migraciones PostgreSQL:

```bash
pnpm db:migration:new <nombre>
pnpm db:migrate:status
pnpm db:migrate
pnpm db:pull
pnpm db:reset
```

Para operar contra Supabase remoto, autenticá y vinculá el proyecto localmente. No commitees tokens, `.env` ni `project_ref`.
