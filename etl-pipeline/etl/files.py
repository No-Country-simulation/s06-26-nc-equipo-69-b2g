from pathlib import Path


def referencia_path(data_dir: Path, filename: str) -> Path:
    return _data_path(data_dir, "referencias", filename)


def tensor_path(data_dir: Path, filename: str) -> Path:
    return _data_path(data_dir, "tensores", filename)


def _data_path(data_dir: Path, subdir: str, filename: str) -> Path:
    nested_path = data_dir / subdir / filename
    if nested_path.exists():
        return nested_path
    return data_dir / filename
