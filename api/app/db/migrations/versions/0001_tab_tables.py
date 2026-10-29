"""tab and tab_url

Revision ID: 0001
Revises:
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # IF NOT EXISTS: the tables may already exist from the pre-Alembic version, which created the same schema
    op.execute("""
    CREATE TABLE IF NOT EXISTS tab (
        id          text PRIMARY KEY CONSTRAINT tab_id_check CHECK (id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
        title       text NOT NULL CONSTRAINT tab_title_check CHECK (title <> ''),
        sort_order  integer NOT NULL DEFAULT 1000,
        description text NOT NULL DEFAULT '',
        enabled     boolean NOT NULL DEFAULT true,
        updated_at  timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS tab_url (
        tab_id      text NOT NULL REFERENCES tab(id) ON DELETE CASCADE ON UPDATE CASCADE,
        env         text NOT NULL DEFAULT 'default',
        url         text NOT NULL CONSTRAINT tab_url_url_check CHECK (url ~ '^https?://[^/]+'),
        PRIMARY KEY (tab_id, env)
    );
    """)


def downgrade() -> None:
    op.drop_table("tab_url")
    op.drop_table("tab")
