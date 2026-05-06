"""Stub bridge migration - represents prior applied state

Revision ID: 5d3539245e6e
Revises: d8f3a12c9e01
Create Date: 2026-05-03 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '5d3539245e6e'
down_revision: Union[str, None] = 'd8f3a12c9e01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Columns were applied directly via psql ALTER TABLE on 2026-05-04.
    # This migration is a no-op to reconcile Alembic history.
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Add phone_number and phone_verified to users if missing (idempotent)
    user_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'phone_number' not in user_cols:
        op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))
    if 'phone_verified' not in user_cols:
        op.add_column('users', sa.Column('phone_verified', sa.Boolean(), server_default='false', nullable=False))

    # Create call_logs table if it doesn't exist (idempotent)
    existing_tables = inspector.get_table_names()
    if 'call_logs' not in existing_tables:
        op.create_table(
            'call_logs',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('coordinator_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
            sa.Column('patient_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
            sa.Column('twilio_call_sid', sa.String(100), nullable=True),
            sa.Column('status', sa.String(50), nullable=True),
            sa.Column('duration_seconds', sa.Integer(), nullable=True),
            sa.Column('initiated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.drop_table('call_logs')
    op.drop_column('users', 'phone_verified')
    op.drop_column('users', 'phone_number')
