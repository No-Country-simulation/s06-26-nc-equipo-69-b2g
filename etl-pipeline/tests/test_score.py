from etl.score import (
    PESO_CONCENTRACION,
    PESO_INFRA,
    PESO_VULNERABILIDAD,
    compute_concentracion,
    compute_infra,
    compute_score,
    compute_vulnerabilidad,
    nivel_riesgo,
)


def test_compute_infra_averages_three_components():
    assert compute_infra(0.3, 0.6, 0.0) == 0.3


def test_compute_concentracion_basic_ratio():
    assert compute_concentracion(50, 200) == 0.25


def test_compute_concentracion_handles_zero_max():
    assert compute_concentracion(0, 0) == 0.0


def test_compute_vulnerabilidad_basic_ratio():
    assert compute_vulnerabilidad(30, 100) == 0.3


def test_compute_vulnerabilidad_handles_zero_total():
    assert compute_vulnerabilidad(0, 0) == 0.0


def test_compute_score_weights_sum_to_components():
    infra, concentracion, vulnerabilidad = 0.4, 0.6, 0.8
    expected = (
        PESO_INFRA * infra
        + PESO_CONCENTRACION * concentracion
        + PESO_VULNERABILIDAD * vulnerabilidad
    )
    assert compute_score(infra, concentracion, vulnerabilidad) == expected


def test_compute_score_weights_sum_to_one():
    assert round(PESO_INFRA + PESO_CONCENTRACION + PESO_VULNERABILIDAD, 10) == 1.0


def test_nivel_riesgo_thresholds():
    assert nivel_riesgo(0.66) == "ALTO"
    assert nivel_riesgo(0.33) == "MEDIO"
    assert nivel_riesgo(0.329999) == "BAJO"
