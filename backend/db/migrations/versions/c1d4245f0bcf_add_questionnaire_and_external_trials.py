"""Add questionnaire, external_trial_matches, and LLM filter columns

Revision ID: c1d4245f0bcf
Revises: ade8ad9abe84
Create Date: 2026-05-02 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c1d4245f0bcf'
down_revision: Union[str, None] = 'ade8ad9abe84'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # patient_questionnaire table
    op.create_table('patient_questionnaire',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('primary_condition', sa.String(length=255), nullable=False),
        sa.Column('condition_stage', sa.String(length=100), nullable=True),
        sa.Column('condition_duration', sa.String(length=100), nullable=True),
        sa.Column('prior_treatments', sa.Text(), nullable=True),
        sa.Column('current_medications', sa.Text(), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=50), nullable=True),
        sa.Column('additional_notes', sa.Text(), nullable=True),
        sa.Column('search_query_built', sa.Text(), nullable=True),
        sa.Column('search_status', sa.String(length=50), nullable=True, server_default='completed'),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id')
    )
    op.create_index(op.f('ix_patient_questionnaire_id'), 'patient_questionnaire', ['id'], unique=False)
    op.create_index(op.f('ix_patient_questionnaire_patient_id'), 'patient_questionnaire', ['patient_id'], unique=False)

    # external_trial_matches table (with LLM filter columns)
    op.create_table('external_trial_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('source_database', sa.String(length=255), nullable=True),
        sa.Column('source_database_url', sa.String(length=500), nullable=True),
        sa.Column('external_trial_id', sa.String(length=255), nullable=True),
        sa.Column('trial_name', sa.Text(), nullable=True),
        sa.Column('condition', sa.String(length=255), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('phase', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=100), nullable=True),
        sa.Column('eligibility_summary', sa.Text(), nullable=True),
        sa.Column('external_url', sa.Text(), nullable=True),
        sa.Column('match_score', sa.Float(), nullable=True),
        sa.Column('match_tier', sa.String(length=20), nullable=True),
        sa.Column('match_reason', sa.Text(), nullable=True),
        sa.Column('why_relevant', sa.Text(), nullable=True),
        sa.Column('concerns', sa.Text(), nullable=True),
        sa.Column('fetched_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_external_trial_matches_id'), 'external_trial_matches', ['id'], unique=False)
    op.create_index(op.f('ix_external_trial_matches_patient_id'), 'external_trial_matches', ['patient_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_external_trial_matches_patient_id'), table_name='external_trial_matches')
    op.drop_index(op.f('ix_external_trial_matches_id'), table_name='external_trial_matches')
    op.drop_table('external_trial_matches')
    op.drop_index(op.f('ix_patient_questionnaire_patient_id'), table_name='patient_questionnaire')
    op.drop_index(op.f('ix_patient_questionnaire_id'), table_name='patient_questionnaire')
    op.drop_table('patient_questionnaire')
