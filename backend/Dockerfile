FROM python:3.13-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

FROM python:3.13-slim AS runtime

WORKDIR /app

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

EXPOSE 8000

CMD ["python", "start.py"]
