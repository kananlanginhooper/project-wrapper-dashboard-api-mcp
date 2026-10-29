"""SQLAlchemy engine and sessions for the tab table; created on first use, only when DB_HOST is set."""

from collections.abc import Iterator
from contextlib import contextmanager
from functools import lru_cache
from pathlib import Path

from sqlalchemy import URL, Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def database_url() -> URL:
    s = get_settings()
    return URL.create(
        "postgresql+psycopg",
        username=s.db_user,
        password=s.db_password,
        host=s.db_host,
        port=s.db_port,
        database=s.db_name,
    )


@lru_cache
def engine() -> Engine:
    return create_engine(
        database_url(), pool_pre_ping=True, connect_args={"connect_timeout": 5, "application_name": "home-dashboards"}
    )


@contextmanager
def session() -> Iterator[Session]:
    with sessionmaker(engine(), expire_on_commit=False)() as s, s.begin():
        yield s


def migrate() -> None:
    """Bring the schema to the latest Alembic revision. Runs at start: schema changes happen from one place."""
    from alembic import command
    from alembic.config import Config

    here = Path(__file__).resolve().parent
    cfg = Config()
    cfg.set_main_option("script_location", str(here / "migrations"))
    with engine().begin() as conn:
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "head")
