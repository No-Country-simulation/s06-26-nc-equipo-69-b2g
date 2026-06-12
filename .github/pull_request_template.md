## Convenciones

- Titulo del PR: Conventional Commits, ej. `feat(auth): agregar login con Supabase`.
- Rama: `<type>/<issue-id>-descripcion-corta`, ej. `feat/42-agregar-login`.
- Issue vinculado: debe estar aprobado antes de mergear.

## Issue vinculado

Closes #

## Tipo de PR

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation only
- [ ] Code refactoring
- [ ] Maintenance/tooling
- [ ] Breaking change

## Resumen

-

## Cambios principales

| Archivo        | Cambio            |
| -------------- | ----------------- |
| `path/to/file` | Descripcion breve |

## Verificacion

- [ ] `pnpm check`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Checklist

- [ ] El PR vincula un issue aprobado.
- [ ] El PR tiene exactamente un label `type:*`.
- [ ] Use pnpm, no npm/npx/yarn.
- [ ] Actualice documentacion si cambio comportamiento o workflow.
- [ ] No agregue secretos ni credenciales reales.
