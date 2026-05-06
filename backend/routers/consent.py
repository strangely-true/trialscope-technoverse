"""
Consent router — template upload, participant signing, review downloads, audit trail.
"""
import hashlib
import io
import os
import re
from datetime import datetime

import pypdf
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import ConsentAuditLog, ConsentSubmission, MatchedCandidate, Trial, User, VerifiedPatient, IdentityMap, ExtractedCandidate
from models.schemas import ConsentResponse, ConsentSubmit, ConsentTemplateOut, ConsentSubmissionOut
from auth.jwt_handler import get_current_user, require_pharma, require_patient, require_coordinator
from agents.agent6_consent import run_consent_simplification
from services.s3_service import upload_to_s3, build_text_pdf, download_from_s3

router = APIRouter(prefix="/consent", tags=["Consent"])


DEFAULT_CONSENT_TEMPLATE = """Clinical Trial Consent Template

I understand that I am being invited to join a clinical research study.

Participant name: [[participant_name]]
Date of birth: [[date_of_birth]]
City: [[city]]
Country: [[country]]

I understand the possible risks, benefits, and withdrawal rights.
I agree that my data may be used for research in anonymised form.
"""


def _trial_or_404(db: Session, trial_id: int) -> Trial:
    trial = db.query(Trial).filter(Trial.id == trial_id).first()
    if not trial:
        raise HTTPException(status_code=404, detail="Trial not found")
    return trial


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception as exc:
        print(f"[Consent] PDF extract error: {exc}")
        return ""


def _extract_fields(template_text: str) -> list[str]:
    matches = re.findall(r"\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}", template_text or "")
    fields: list[str] = []
    for left, right in matches:
        raw = (left or right or "").strip()
        # normalize: lowercase, spaces -> underscore
        field_name = re.sub(r"\s+", "_", raw).lower()
        if field_name and field_name not in fields:
            fields.append(field_name)
    return fields


def _render_template_with_values(template_text: str, values: dict) -> str:
    """Replace [[name]] or {{name}} placeholders in template_text with provided values.
    Normalizes placeholder keys the same way as _extract_fields (lowercase, underscores).
    """
    def _lookup(match):
        raw = (match.group(1) or match.group(2) or "").strip()
        key = re.sub(r"\s+", "_", raw).lower()
        val = values.get(key)
        return str(val) if val is not None else ""

    return re.sub(r"\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}", _lookup, template_text or "")


def _template_text_for_trial(trial: Trial) -> str:
    return trial.consent_template_text or DEFAULT_CONSENT_TEMPLATE


def _resolve_subject_hash_and_label(db: Session, trial_id: int, subject_id: str) -> tuple[str, str]:
    if subject_id.startswith("p_"):
        patient_id = int(subject_id[2:])
        patient = db.query(VerifiedPatient).filter(
            VerifiedPatient.id == patient_id,
            VerifiedPatient.trial_id == trial_id,
        ).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient.hash_id, f"patient_{patient.id}"

    if subject_id.startswith("cand_"):
        candidate_id = int(subject_id[5:])
        candidate = db.query(ExtractedCandidate).filter(ExtractedCandidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        hash_source = candidate.user_handle or str(candidate.id)
        hash_id = hashlib.sha256(hash_source.encode()).hexdigest()
        return hash_id, f"candidate_{candidate.id}"

    identity = db.query(IdentityMap).filter(IdentityMap.hash_id == subject_id).first()
    if identity:
        return identity.hash_id, identity.hash_id

    raise HTTPException(status_code=404, detail="Consent subject not found")


def _consent_submission_for_hash(db: Session, trial_id: int, hash_id: str) -> ConsentSubmission:
    submission = (
        db.query(ConsentSubmission)
        .filter(ConsentSubmission.trial_id == trial_id, ConsentSubmission.hash_id == hash_id)
        .order_by(ConsentSubmission.signed_at.desc())
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Consent submission not found")
    return submission


def _signed_pdf_lines(trial: Trial, submission: ConsentSubmission, template_text: str) -> list[str]:
    lines = [
        f"Trial: {trial.title}",
        f"Disease: {trial.disease}",
        f"Consent version: {submission.template_version}",
        f"Typed name: {submission.typed_name}",
        f"Acknowledged: {'Yes' if submission.acknowledged else 'No'}",
        f"Signed at: {submission.signed_at.isoformat() if submission.signed_at else ''}",
        "",
        "Template:",
    ]
    # Render template with submitted field values so the PDF shows filled fields inline
    rendered = _render_template_with_values(template_text or DEFAULT_CONSENT_TEMPLATE, submission.field_values or {})
    lines.extend(rendered.splitlines())
    lines.append("")
    lines.append("Submitted field values:")
    for key, value in (submission.field_values or {}).items():
        lines.append(f"- {key}: {value}")
    return lines


def _audit(db: Session, trial_id: int, candidate_id: int | None, response: str, message: str, channel: str = "consent_form") -> None:
    db.add(
        ConsentAuditLog(
            candidate_id=candidate_id,
            trial_id=trial_id,
            channel=channel,
            message_sent=message,
            response=response,
        )
    )


@router.post("/upload")
async def upload_consent_doc(
    trial_id: int,
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pharma),
):
    """Pharma uploads a consent template PDF or activates the built-in template."""
    trial = _trial_or_404(db, trial_id)
    if trial.pharma_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Trial access denied")

    bucket = os.getenv("S3_BUCKET_CONSENT", "trialgo-consent-docs")
    consent_version = (trial.consent_version or 0) + 1

    if file is None:
        trial.consent_template_name = "Built-in consent template"
        trial.consent_template_text = DEFAULT_CONSENT_TEMPLATE
        trial.consent_template_url = None
        trial.consent_version = consent_version
        db.commit()
        summary = run_consent_simplification(trial_id, None, raw_text=DEFAULT_CONSENT_TEMPLATE)
        return {
            "trial_id": trial_id,
            "title": trial.title,
            "source": "default",
            "consent_template_name": trial.consent_template_name,
            "consent_template_text": trial.consent_template_text,
            "consent_version": trial.consent_version,
            "simplified_summary": summary,
        }

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    template_text = _extract_pdf_text(content) or DEFAULT_CONSENT_TEMPLATE
    s3_key = f"trial_{trial_id}/templates/{file.filename}"
    s3_url = upload_to_s3(content, bucket, s3_key)

    trial.consent_template_url = s3_url
    trial.consent_template_name = file.filename
    trial.consent_template_text = template_text
    trial.consent_version = consent_version
    db.commit()

    summary = run_consent_simplification(trial_id, s3_url, pdf_bytes=content)
    return {
        "trial_id": trial_id,
        "title": trial.title,
        "source": "uploaded",
        "consent_template_url": s3_url,
        "consent_template_name": file.filename,
        "consent_template_text": template_text,
        "consent_version": trial.consent_version,
        "simplified_summary": summary,
    }


@router.get("/template/{trial_id}", response_model=ConsentTemplateOut)
def get_consent_template(
    trial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trial = _trial_or_404(db, trial_id)
    template_text = _template_text_for_trial(trial)
    return ConsentTemplateOut(
        trial_id=trial.id,
        title=trial.title,
        consent_template_url=trial.consent_template_url,
        consent_template_name=trial.consent_template_name,
        consent_template_text=template_text,
        consent_version=trial.consent_version or 1,
        source="uploaded" if trial.consent_template_url else "default",
    )


@router.post("/submit", response_model=ConsentSubmissionOut)
def submit_consent(
    payload: ConsentSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
):
    trial = _trial_or_404(db, payload.trial_id)
    template_text = _template_text_for_trial(trial)
    required_fields = _extract_fields(template_text)

    if not payload.acknowledged:
        raise HTTPException(status_code=400, detail="Consent must be acknowledged")

    missing_fields = [field for field in required_fields if not str(payload.field_values.get(field, "")).strip()]
    if missing_fields:
        raise HTTPException(status_code=400, detail=f"Missing consent fields: {', '.join(missing_fields)}")

    hash_id = hashlib.sha256(current_user.email.encode()).hexdigest()
    bucket = os.getenv("S3_BUCKET_CONSENT", "trialgo-consent-docs")

    existing = (
        db.query(ConsentSubmission)
        .filter(ConsentSubmission.trial_id == payload.trial_id, ConsentSubmission.hash_id == hash_id)
        .order_by(ConsentSubmission.signed_at.desc())
        .first()
    )

    submission = existing or ConsentSubmission(
        trial_id=payload.trial_id,
        hash_id=hash_id,
        user_id=current_user.id,
    )
    submission.candidate_id = submission.candidate_id
    submission.template_url = trial.consent_template_url
    submission.template_name = trial.consent_template_name or "Built-in consent template"
    submission.template_version = trial.consent_version or 1
    submission.typed_name = payload.typed_name.strip()
    submission.field_values = payload.field_values or {}
    submission.acknowledged = True

    signed_lines = _signed_pdf_lines(trial, submission, template_text)
    pdf_bytes = build_text_pdf(f"Signed consent - {trial.title}", signed_lines)
    pdf_key = f"trial_{trial.id}/signed/{hash_id}.pdf"
    pdf_url = upload_to_s3(pdf_bytes, bucket, pdf_key)
    submission.signed_pdf_url = pdf_url
    submission.signed_pdf_key = pdf_key

    if existing is None:
        db.add(submission)
    db.add(
        ConsentAuditLog(
            candidate_id=None,
            trial_id=trial.id,
            channel="consent_form",
            message_sent=f"Consent signed by {submission.typed_name}",
            response="SIGNED",
        )
    )
    db.commit()
    db.refresh(submission)

    return ConsentSubmissionOut(
        id=submission.id,
        trial_id=submission.trial_id,
        hash_id=submission.hash_id,
        typed_name=submission.typed_name,
        acknowledged=submission.acknowledged,
        signed_pdf_url=submission.signed_pdf_url,
        signed_at=submission.signed_at,
    )


@router.get("/download/{trial_id}/{subject_id}")
def download_signed_consent(
    trial_id: int,
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trial = _trial_or_404(db, trial_id)
    if current_user.role.value not in ("coordinator", "pharma"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role.value == "pharma" and trial.pharma_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Trial access denied")
    hash_id, subject_label = _resolve_subject_hash_and_label(db, trial_id, subject_id)
    submission = _consent_submission_for_hash(db, trial_id, hash_id)
    template_text = _template_text_for_trial(trial)
    pdf_bytes = build_text_pdf(
        f"Signed consent - {trial.title}",
        _signed_pdf_lines(trial, submission, template_text),
    )
    filename = f"consent-{subject_label}-trial-{trial_id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/respond")
def respond_to_consent(
    payload: ConsentResponse,
    db: Session = Depends(get_db),
):
    """Patient responds YES/NO to consent request (via webhook)."""
    candidate = db.query(MatchedCandidate).filter(
        MatchedCandidate.candidate_id == payload.candidate_id,
        MatchedCandidate.trial_id == payload.trial_id,
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate/trial record not found")

    if payload.response.upper() == "YES":
        candidate.status = "consent_given"
    elif payload.response.upper() == "NO":
        candidate.status = "opted_out"
    else:
        raise HTTPException(status_code=400, detail="Response must be YES or NO")

    # Append-only audit log
    _audit(
        db,
        trial_id=payload.trial_id,
        candidate_id=payload.candidate_id,
        response=payload.response.upper(),
        message="System consent request",
        channel="webhook",
    )
    db.commit()

    return {"status": "recorded", "new_status": candidate.status}


@router.get("/audit/{candidate_id}")
def get_audit_trail(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator),
):
    """Full consent audit trail for a candidate (coordinator only)."""
    logs = (
        db.query(ConsentAuditLog)
        .filter(ConsentAuditLog.candidate_id == candidate_id)
        .order_by(ConsentAuditLog.timestamp.asc())
        .all()
    )
    return [
        {
            "id": l.id,
            "channel": l.channel,
            "message_sent": l.message_sent,
            "response": l.response,
            "timestamp": l.timestamp,
        }
        for l in logs
    ]


@router.get("/summary/{trial_id}")
def get_consent_summary(
    trial_id: int,
    db: Session = Depends(get_db),
):
    """Return a simplified consent summary for a trial (public)."""
    # Use agent 6 to provide a simplified summary; agent has fallback heuristics
    trial = _trial_or_404(db, trial_id)
    summary = run_consent_simplification(trial_id, trial.consent_template_url, raw_text=_template_text_for_trial(trial))
    return summary
