"""Alembic environment: migrations run on the connection app.db.session.migrate() hands over (no alembic.ini)."""

from alembic import context

from app.db.models import Base

connection = context.config.attributes["connection"]
context.configure(connection=connection, target_metadata=Base.metadata)
with context.begin_transaction():
    context.run_migrations()
