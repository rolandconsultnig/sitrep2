from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os
from pathlib import Path

from dotenv import load_dotenv

# Get the backend directory path
BASE_DIR = Path(__file__).parent

# Load backend/.env so DATABASE_URL can target PostgreSQL (e.g. sitrep_db) without shell exports
load_dotenv(BASE_DIR / ".env")

# Set DATABASE_URL for PostgreSQL, e.g.
# postgresql+psycopg2://user:password@localhost:5432/sitrep_db
# If unset, uses local SQLite (npf_sitrep.db).
_database_url = os.environ.get("DATABASE_URL", "").strip()
if _database_url:
    SQLALCHEMY_DATABASE_URL = _database_url
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
else:
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{BASE_DIR}/npf_sitrep.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
