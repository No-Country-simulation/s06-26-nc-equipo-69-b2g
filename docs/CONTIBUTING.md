# Guía de Contribución

Gracias por querer contribuir a este proyecto. Para mantener el código limpio y organizado, seguí estas reglas.

---

## Estrategia de Ramas (Branching)

No se permite hacer push directamente a `main`. Todas las contribuciones deben realizarse mediante **ramas de trabajo**.

### Formato de nombres de rama

* `feature/nombre-de-la-funcionalidad`
* `fix/descripcion-del-error`
* `docs/mejoras-en-documentacion`
* `refactor/nombre-del-cambio`
* `chore/nombre-del-cambio`

---

## Flujo de Trabajo (Workflow)

### 1. Sincronizar

Asegurate de tener la última versión de `main`:

```bash
git checkout main
git pull origin main
```

### 2. Crear una rama

```bash
git checkout -b feature/nueva-funcionalidad
```

### 3. Desarrollar

Escribí tu código siguiendo los estándares definidos para el proyecto.

### 4. Commit

Utilizá la convención de commits definida en la siguiente sección.

### 5. Pull Request

Subí tu rama al repositorio remoto y abrí un Pull Request hacia `main` utilizando la plantilla correspondiente.

---

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
| `style`    | Cambios de formato (no afectan la lógica)                      |
| `perf`     | Mejoras de rendimiento                                         |

### Scope (opcional)

Ejemplos:

* `backend`
* `frontend`
* `api`
* `docs`
* `config`

### Descripción

La descripción debe:

* Estar escrita en español.
* Utilizar modo imperativo.
* No comenzar con mayúscula.
* No finalizar con punto.

### Ejemplos

```text
feat(backend): agregar endpoint de consulta
fix(api): corregir validación de fechas
docs(readme): actualizar instrucciones de instalación
refactor: extraer lógica a módulo separado
chore: actualizar dependencias
```

---

## Template para Pull Requests

Cada Pull Request debe incluir la siguiente estructura:

### Descripción

> Explicá brevemente qué hace este PR y por qué es necesario.

### Tipo de cambio

* [ ] Bugfix (corrección de error)
* [ ] Feature (nueva funcionalidad)
* [ ] Refactor (cambio que no agrega funcionalidad ni corrige errores)
* [ ] Style (cambios de formato, lint, etc.)
* [ ] Docs (cambios en documentación)
* [ ] Chore (cambios en build, dependencias, CI, etc.)

### ¿Cómo se probó?

* [ ] Tests unitarios
* [ ] Tests de integración
* [ ] Prueba manual

### Screenshots / Logs (si aplica)

Adjuntá capturas de pantalla, logs o evidencia relevante.

### Checklist

* [ ] Mi código sigue el estilo definido por el proyecto.
* [ ] Actualicé la documentación si era necesario.
* [ ] Agregué o actualicé tests cuando correspondía.
* [ ] Los tests pasan correctamente en mi entorno local.

```