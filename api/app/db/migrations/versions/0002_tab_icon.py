"""tab.icon: a Material Symbols name for the phone tab bar

Revision ID: 0002
Revises: 0001
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # a constant default: Postgres adds the column without rewriting the table
    op.execute("ALTER TABLE tab ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT ''")


def downgrade() -> None:
    op.drop_column("tab", "icon")
