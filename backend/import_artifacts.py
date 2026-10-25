#!/usr/bin/env python3
"""Install a Colab-exported ``rydexa_artifacts.zip`` into ``backend/artifacts``.

The training notebook writes four files and bundles them with
``shutil.make_archive``. This script is the missing backend half of that
workflow: it validates the archive (paths, required files, JSON shape and a
real joblib load), backs up the current artifacts, then installs the new ones.

Usage
-----
    python backend/import_artifacts.py ~/Downloads/rydexa_artifacts.zip
    python backend/import_artifacts.py rydexa_artifacts.zip --check-only
    python backend/import_artifacts.py rydexa_artifacts.zip --artifacts-dir /srv/rydexa/artifacts

Run ``--check-only`` to validate an archive without touching the backend.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_ARTIFACTS_DIR = BASE_DIR / "artifacts"

REQUIRED_FILES = (
    "model.joblib",
    "metrics.json",
    "feature_schema.json",
    "analytics_summary.json",
)
MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024  # Guard against zip bombs.


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def info(message: str) -> None:
    print(f"  {message}")


def _is_symlink(info: zipfile.ZipInfo) -> bool:
    return (info.external_attr >> 16) & 0o170000 == 0o120000


def inspect_archive(archive: Path) -> tuple[list[zipfile.ZipInfo], str]:
    """Return file members and the common prefix that contains the artifacts."""
    if not archive.is_file():
        fail(f"archive not found: {archive}")

    try:
        zf = zipfile.ZipFile(archive)
    except zipfile.BadZipFile:
        fail(f"not a valid ZIP archive: {archive}")

    with zf:
        files: list[zipfile.ZipInfo] = []
        total = 0
        for member in zf.infolist():
            if member.is_dir():
                continue
            name = member.filename.replace("\\", "/")
            parts = Path(name).parts
            if (
                name.startswith("/")
                or ":" in name
                or ".." in parts
                or _is_symlink(member)
            ):
                fail(f"unsafe path in archive: {member.filename!r}")
            total += member.file_size
            if total > MAX_UNCOMPRESSED_BYTES:
                fail("archive expands beyond the 200 MB safety limit")
            files.append(member)

        names = {member.filename.replace("\\", "/") for member in files}

        candidates: list[str] = []
        for required in REQUIRED_FILES:
            if required in names:
                candidates.append("")
                break
        for member in files:
            parts = Path(member.filename.replace("\\", "/")).parts
            for depth in range(1, len(parts)):
                prefix = "/".join(parts[:depth]) + "/"
                if all(prefix + required in names for required in REQUIRED_FILES):
                    candidates.append(prefix)

        if not candidates:
            missing = [name for name in REQUIRED_FILES if name not in names]
            fail(
                "archive does not contain the expected artifact set "
                f"({', '.join(REQUIRED_FILES)}). Missing at root: {', '.join(missing)}"
            )

        prefix = sorted(set(candidates), key=len)[0]
        selected = []
        for member in files:
            name = member.filename.replace("\\", "/")
            if prefix and not name.startswith(prefix):
                continue
            relative = name[len(prefix):] if prefix else name
            if relative in REQUIRED_FILES:
                selected.append(member)

        present = {member.filename.replace("\\", "/")[len(prefix):] for member in selected}
        missing = [name for name in REQUIRED_FILES if name not in present]
        if missing:
            fail(f"archive is incomplete, missing: {', '.join(missing)}")

        return selected, prefix


def read_member(zf: zipfile.ZipFile, member: zipfile.ZipInfo, destination: Path) -> None:
    with zf.open(member) as source, open(destination, "wb") as target:
        shutil.copyfileobj(source, target)


def load_json(path: Path, label: str) -> object:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        fail(f"{label} is not valid JSON: {error}")


def validate(directory: Path) -> dict[str, str]:
    """Validate the extracted artifact set and return a small summary."""
    metrics = load_json(directory / "metrics.json", "metrics.json")
    schema = load_json(directory / "feature_schema.json", "feature_schema.json")
    analytics = load_json(directory / "analytics_summary.json", "analytics_summary.json")

    if not isinstance(metrics, dict):
        fail("metrics.json must contain a JSON object")
    for key in ("champion_model", "champion_metrics", "models_evaluated"):
        if key not in metrics:
            fail(f"metrics.json is missing '{key}'")
    champion_metrics = metrics.get("champion_metrics")
    if not isinstance(champion_metrics, dict):
        fail("metrics.json 'champion_metrics' must be an object")
    for key in ("mae", "rmse", "r2"):
        if not isinstance(champion_metrics.get(key), (int, float)):
            fail(f"metrics.json 'champion_metrics.{key}' must be numeric")

    if not isinstance(schema, dict) or not isinstance(schema.get("features"), list):
        fail("feature_schema.json must contain a 'features' list")
    if not schema["features"] or not all(isinstance(item, str) for item in schema["features"]):
        fail("feature_schema.json 'features' must be a non-empty list of strings")
    if not isinstance(analytics, dict) or not analytics:
        fail("analytics_summary.json must contain a non-empty JSON object")

    try:
        import joblib  # type: ignore
    except ImportError:
        fail("joblib is not installed. Run: pip install -r backend/requirements.txt")

    try:
        model = joblib.load(directory / "model.joblib")
    except Exception as error:  # noqa: BLE001 - report any unpickling failure verbatim
        fail(
            "model.joblib could not be loaded "
            f"({error}). Train and export it with the same scikit-learn major version."
        )
    if not hasattr(model, "predict"):
        fail("model.joblib does not expose a predict() method")

    champion = str(metrics.get("champion_model", "unknown"))
    summary = {
        "champion": champion,
        "mae": f"{float(champion_metrics['mae']):.2f}",
        "rmse": f"{float(champion_metrics['rmse']):.2f}",
        "r2": f"{float(champion_metrics['r2']):.4f}",
        "features": str(len(schema["features"])),
        "model_type": type(model).__name__,
    }
    return summary


def install(archive: Path, artifacts_dir: Path, check_only: bool) -> None:
    selected, prefix = inspect_archive(archive)

    with tempfile.TemporaryDirectory(prefix="rydexa-import-") as temporary:
        staging = Path(temporary)
        with zipfile.ZipFile(archive) as zf:
            for member in selected:
                name = member.filename.replace("\\", "/")
                relative = name[len(prefix):] if prefix else name
                read_member(zf, member, staging / relative)

        print(f"Validating {archive.name} …")
        summary = validate(staging)
        info(f"model: {summary['model_type']} — predict() available")
        info(
            f"champion: {summary['champion']} "
            f"(MAE {summary['mae']} · RMSE {summary['rmse']} · R² {summary['r2']})"
        )
        info(f"feature schema: {summary['features']} features")
        info("analytics summary: valid JSON")

        if check_only:
            print("\nArchive is valid. Nothing was installed (--check-only).")
            return

        backup: Path | None = None
        if artifacts_dir.exists():
            has_existing = any((artifacts_dir / name).exists() for name in REQUIRED_FILES)
            if has_existing:
                stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                backup = artifacts_dir.with_name(f"{artifacts_dir.name}.backup-{stamp}")
                counter = 1
                while backup.exists():
                    backup = artifacts_dir.with_name(
                        f"{artifacts_dir.name}.backup-{stamp}-{counter}"
                    )
                    counter += 1
                shutil.copytree(artifacts_dir, backup)

        artifacts_dir.mkdir(parents=True, exist_ok=True)
        for name in REQUIRED_FILES:
            shutil.copy2(staging / name, artifacts_dir / name)

    print(f"\nInstalled into {artifacts_dir}")
    if backup:
        print(f"Previous artifacts backed up to {backup}")
    else:
        print("No previous artifacts to back up.")
    print("Restart the FastAPI backend to load the new model:")
    print("  python backend/run.py")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate and install a Colab-exported rydexa_artifacts.zip."
    )
    parser.add_argument("archive", type=Path, help="path to rydexa_artifacts.zip")
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=DEFAULT_ARTIFACTS_DIR,
        help=f"destination directory (default: {DEFAULT_ARTIFACTS_DIR})",
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="validate the archive without installing anything",
    )
    args = parser.parse_args()
    install(args.archive.expanduser(), args.artifacts_dir.expanduser(), args.check_only)


if __name__ == "__main__":
    main()
