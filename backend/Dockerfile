FROM python:3.13-slim

WORKDIR /app

# Install dependencies (no build-essential since we removed C-ext libs)
# But it's good practice to have it just in case
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Copy the start script (create it in docker-compose command)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
