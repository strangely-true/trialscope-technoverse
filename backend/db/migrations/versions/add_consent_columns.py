"""add consent columns to trials and create consent submissions

Revision ID: e1f2g3h4i5j6
Revises: f1c3d9a7b8e2
Create Date: 2025-01-15 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1f2g3h4i5j6"
down_revision: Union[str, None] = "f1c3d9a7b8e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    trial_columns = {column["name"] for column in inspector.get_columns("trials")}
    if "consent_template_url" not in trial_columns:
        op.add_column("trials", sa.Column("consent_template_url", sa.String(length=500), nullable=True))
    if "consent_template_name" not in trial_columns:
        op.add_column("trials", sa.Column("consent_template_name", sa.String(length=255), nullable=True))
    if "consent_template_text" not in trial_columns:
        op.add_column("trials", sa.Column("consent_template_text", sa.Text(), nullable=True))
    if "consent_version" not in trial_columns:
        op.add_column(
            "trials",
            sa.Column("consent_version", sa.Integer(), nullable=True, server_default="1"),
        )

    tables = set(inspector.get_table_names())
    if "consent_submissions" not in tables:
        op.create_table(
            "consent_submissions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("trial_id", sa.Integer(), nullable=False),
            sa.Column("hash_id", sa.String(length=64), nullable=False),
            sa.Column("candidate_id", sa.Integer(), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("template_url", sa.String(length=500), nullable=True),
            sa.Column("template_name", sa.String(length=255), nullable=True),
            sa.Column("template_version", sa.Integer(), nullable=True, server_default="1"),
            sa.Column("typed_name", sa.String(length=255), nullable=False),
            sa.Column("field_values", sa.JSON(), nullable=True),
            sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("signed_pdf_url", sa.String(length=500), nullable=True),
            sa.Column("signed_pdf_key", sa.String(length=500), nullable=True),
            sa.Column("signed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(["candidate_id"], ["extracted_candidates.id"]),
            sa.ForeignKeyConstraint(["trial_id"], ["trials.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_consent_submissions_trial_id"), "consent_submissions", ["trial_id"], unique=False)
        op.create_index(op.f("ix_consent_submissions_hash_id"), "consent_submissions", ["hash_id"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    tables = set(inspector.get_table_names())
    if "consent_submissions" in tables:
        submission_indexes = {idx["name"] for idx in inspector.get_indexes("consent_submissions")}
        trial_index = op.f("ix_consent_submissions_trial_id")
        hash_index = op.f("ix_consent_submissions_hash_id")
        if hash_index in submission_indexes:
            op.drop_index(hash_index, table_name="consent_submissions")
        if trial_index in submission_indexes:
            op.drop_index(trial_index, table_name="consent_submissions")
        op.drop_table("consent_submissions")

    trial_columns = {column["name"] for column in inspector.get_columns("trials")}
    if "consent_version" in trial_columns:
        op.drop_column("trials", "consent_version")
    if "consent_template_text" in trial_columns:
        op.drop_column("trials", "consent_template_text")
    if "consent_template_name" in trial_columns:
        op.drop_column("trials", "consent_template_name")
    if "consent_template_url" in trial_columns:
        op.drop_column("trials", "consent_template_url")
