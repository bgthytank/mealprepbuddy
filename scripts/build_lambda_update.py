#!/usr/bin/env python3
"""Replace only app/ in an existing Lambda ZIP; preserve installed dependencies.

Usage: python scripts/build_lambda_update.py existing.zip updated.zip
The existing ZIP must be downloaded from the target Lambda function first.
This does not deploy, seed data, or read local environment files.
"""
import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


def build_update(original: Path, output: Path, app_dir: Path) -> None:
    if original.resolve() == output.resolve():
        raise ValueError("The original rollback archive must be kept separately.")
    if not (app_dir / "main.py").is_file():
        raise ValueError("Expected the backend/app source directory.")
    with ZipFile(original) as previous:
        if "app/main.py" not in previous.namelist():
            raise ValueError("The existing Lambda archive does not contain app/main.py.")
        with ZipFile(output, "w", compression=ZIP_DEFLATED) as updated:
            for entry in previous.infolist():
                if not entry.filename.startswith("app/"):
                    updated.writestr(entry, previous.read(entry.filename))
            for source in sorted(app_dir.rglob("*.py")):
                if "__pycache__" not in source.parts:
                    updated.write(source, "app/" + source.relative_to(app_dir).as_posix())
    with ZipFile(output) as updated, ZipFile(original) as previous:
        if updated.testzip() is not None:
            raise ValueError("The generated Lambda archive failed its integrity check.")
        for entry in previous.infolist():
            if not entry.filename.startswith("app/"):
                if updated.read(entry.filename) != previous.read(entry.filename):
                    raise ValueError("An existing dependency was changed.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("original", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build_update(args.original, args.output, Path(__file__).resolve().parents[1] / "backend/app")
    print(f"Built {args.output}; existing non-app files are unchanged.")


if __name__ == "__main__":
    main()
