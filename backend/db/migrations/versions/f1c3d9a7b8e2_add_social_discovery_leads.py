"""Add social discovery leads table

Revision ID: f1c3d9a7b8e2
Revises: 5d3539245e6e
Create Date: 2026-05-04 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1c3d9a7b8e2'
down_revision: Union[str, None] = '5d3539245e6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'social_discovery_leads',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('trial_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('profile_url', sa.String(length=300), nullable=True),
        sa.Column('post_text', sa.Text(), nullable=True),
        sa.Column('post_url', sa.String(length=300), nullable=True),
        sa.Column('llm_confidence', sa.Float(), nullable=True),
        sa.Column('llm_reasoning', sa.Text(), nullable=True),
        sa.Column('relation', sa.String(length=50), nullable=True),
        sa.Column('pharma_action', sa.String(length=50), nullable=True),
        sa.Column('dm_sent', sa.Boolean(), nullable=True),
        sa.Column('dm_sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('discovered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['trial_id'], ['trials.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_social_discovery_leads_id'), 'social_discovery_leads', ['id'], unique=False)
    op.create_index(op.f('ix_social_discovery_leads_trial_id'), 'social_discovery_leads', ['trial_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_social_discovery_leads_trial_id'), table_name='social_discovery_leads')
    op.drop_index(op.f('ix_social_discovery_leads_id'), table_name='social_discovery_leads')
    op.drop_table('social_discovery_leads')
