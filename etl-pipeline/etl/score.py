PESO_INFRA = 0.45
PESO_CONCENTRACION = 0.25
PESO_VULNERABILIDAD = 0.30

UMBRAL_ALTO = 0.66
UMBRAL_MEDIO = 0.33


def compute_infra(congestion: float, drop: float, pct_legacy_tech: float) -> float:
    return (congestion + drop + pct_legacy_tech) / 3


def compute_concentracion(n_usuarios_cluster: float, max_n_usuarios: float) -> float:
    if max_n_usuarios == 0:
        return 0.0
    return n_usuarios_cluster / max_n_usuarios


def compute_vulnerabilidad(count_cd: float, count_total: float) -> float:
    if count_total == 0:
        return 0.0
    return count_cd / count_total


def compute_score(infra: float, concentracion: float, vulnerabilidad: float) -> float:
    return (
        PESO_INFRA * infra
        + PESO_CONCENTRACION * concentracion
        + PESO_VULNERABILIDAD * vulnerabilidad
    )


def nivel_riesgo(score: float) -> str:
    if score >= UMBRAL_ALTO:
        return "ALTO"
    if score >= UMBRAL_MEDIO:
        return "MEDIO"
    return "BAJO"
