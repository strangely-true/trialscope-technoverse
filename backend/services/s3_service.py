"""
AWS S3 Service — upload files and JSON objects.
"""
import boto3
import json
import os
import unicodedata
from dotenv import load_dotenv

load_dotenv()


def _get_client():
    return boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION", "ap-south-1"),
    )


def upload_to_s3(content: bytes, bucket: str, key: str) -> str:
    """Upload raw bytes to S3 and return the public URL."""
    try:
        client = _get_client()
        client.put_object(Bucket=bucket, Key=key, Body=content)
        return f"https://{bucket}.s3.amazonaws.com/{key}"
    except Exception as e:
        print(f"[S3] Upload error: {e}")
        return f"s3://{bucket}/{key}"  # fallback URL


def upload_json_to_s3(data: dict, bucket: str, key: str) -> str:
    """Upload JSON dict to S3 and return the URL."""
    content = json.dumps(data, indent=2, default=str).encode("utf-8")
    return upload_to_s3(content, bucket, key)


def download_from_s3(bucket: str, key: str) -> bytes:
    """Download object bytes from S3."""
    try:
        client = _get_client()
        response = client.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()
    except Exception as e:
        print(f"[S3] Download error: {e}")
        return b""


def _ascii_safe(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text or "")
    return normalized.encode("ascii", "ignore").decode("ascii")


def _pdf_escape(text: str) -> str:
    return _ascii_safe(text).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_text_pdf(title: str, lines: list[str]) -> bytes:
    """Build a very small single-page PDF containing plain text."""
    content_parts = ["BT", "/F1 12 Tf", "50 780 Td", f"({_pdf_escape(title)}) Tj"]
    y = 760
    for line in lines:
        if not line:
            y -= 14
            continue
        content_parts.append(f"1 0 0 1 50 {y} Tm")
        content_parts.append(f"({_pdf_escape(line)}) Tj")
        y -= 14
    content_parts.append("ET")
    content_stream = "\n".join(content_parts).encode("latin-1", "ignore")

    objects: list[bytes] = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    objects.append(
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
    )
    objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
    objects.append(
        f"5 0 obj << /Length {len(content_stream)} >> stream\n".encode("latin-1")
        + content_stream
        + b"\nendstream endobj\n"
    )

    header = b"%PDF-1.4\n"
    cursor = len(header)
    offsets = [0]
    body_parts: list[bytes] = []
    for obj in objects:
        offsets.append(cursor)
        body_parts.append(obj)
        cursor += len(obj)

    body = b"".join(body_parts)
    xref_start = len(header) + len(body)
    xref = [b"xref\n0 6\n0000000000 65535 f \n"]
    for offset in offsets[1:]:
        xref.append(f"{offset:010d} 00000 n \n".encode("latin-1"))
    trailer = (
        b"trailer << /Size 6 /Root 1 0 R >>\n"
        b"startxref\n"
        + str(xref_start).encode("latin-1")
        + b"\n%%EOF"
    )
    return header + body + b"".join(xref) + trailer
