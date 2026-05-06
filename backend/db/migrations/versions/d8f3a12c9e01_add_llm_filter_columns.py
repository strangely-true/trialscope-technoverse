"""Add LLM filter columns to external_trial_matches

Revision ID: d8f3a12c9e01
Revises: c1d4245f0bcf
Create Date: 2026-05-02 14:32:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'd8f3a12c9e01'
down_revision: Union[str, None] = 'c1d4245f0bcf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns only if they don't already exist (safe migration)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = [c['name'] for c in inspector.get_columns('external_trial_matches')]

    if 'match_reason' not in existing:
        op.add_column('external_trial_matches', sa.Column('match_reason', sa.Text(), nullable=True))
    if 'why_relevant' not in existing:
        op.add_column('external_trial_matches', sa.Column('why_relevant', sa.Text(), nullable=True))
    if 'concerns' not in existing:
        op.add_column('external_trial_matches', sa.Column('concerns', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('external_trial_matches', 'concerns')
    op.drop_column('external_trial_matches', 'why_relevant')
    op.drop_column('external_trial_matches', 'match_reason')
