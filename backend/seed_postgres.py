"""
Create PostgreSQL database if missing, then run all seed scripts.

Environment variables (defaults in parentheses):
  POSTGRES_HOST (localhost)
  POSTGRES_PORT (5432)
  POSTGRES_USER (postgres)
  POSTGRES_PASSWORD — empty allowed if your server uses trust/peer for this user
  POSTGRES_DB (sitrep_db)

Example (PowerShell):
  $env:POSTGRES_PASSWORD = 'yourpassword'
  python seed_postgres.py

Then start the API with DATABASE_URL set to the same database (see printed line).
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text

BACKEND = Path(__file__).resolve().parent


def build_sqlalchemy_url(user: str, password: str, host: str, port: str, database: str) -> str:
    user_q = quote_plus(user)
    if password:
        pass_q = quote_plus(password)
        return f"postgresql+psycopg2://{user_q}:{pass_q}@{host}:{port}/{database}"
    return f"postgresql+psycopg2://{user_q}@{host}:{port}/{database}"


def main() -> int:
    host = os.environ.get("POSTGRES_HOST", "localhost")
    port = os.environ.get("POSTGRES_PORT", "5432")
    user = os.environ.get("POSTGRES_USER", "postgres")
    password = os.environ.get("POSTGRES_PASSWORD", "")
    dbname = os.environ.get("POSTGRES_DB", "sitrep_db")

    if not dbname.replace("_", "").isalnum():
        print("ERROR: POSTGRES_DB must be alphanumeric plus underscores only.")
        return 1

    admin_url = build_sqlalchemy_url(user, password, host, port, "postgres")
    try:
        engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :n"),
                {"n": dbname},
            ).fetchone()
            if not row:
                conn.execute(text(f'CREATE DATABASE "{dbname}"'))
                print(f"+ Created database {dbname}")
            else:
                print(f"+ Database {dbname} already exists")
    except Exception as e:
        print(f"ERROR: could not connect or create database: {e}")
        return 1

    app_url = build_sqlalchemy_url(user, password, host, port, dbname)
    env = os.environ.copy()
    env["DATABASE_URL"] = app_url

    scripts = [
        "init_db.py",
        "init_ranks.py",
        "init_agencies.py",
        "create_test_users.py",
    ]
    for script in scripts:
        path = BACKEND / script
        if not path.is_file():
            print(f"ERROR: missing {path}")
            return 1
        print(f"\n--- {script} ---")
        r = subprocess.run([sys.executable, str(path)], cwd=str(BACKEND), env=env)
        if r.returncode != 0:
            print(f"ERROR: {script} exited with {r.returncode}")
            return r.returncode

    print("\n+ Seeding finished.")
    print("  Point the app at PostgreSQL by setting:")
    print(f'  DATABASE_URL="{app_url}"')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
