$ErrorActionPreference = "Stop"

# Create Database and run migrations
Write-Host "Running Alembic migrations..."
.\venv\Scripts\python.exe -m alembic revision --autogenerate -m "Init DB"
.\venv\Scripts\python.exe -m alembic upgrade head

# Start Celery Worker (In background)
Write-Host "Starting Celery worker..."
Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m", "celery", "-A", "tasks.celery_worker", "worker", "--loglevel=info" -NoNewWindow

# Start Celery Beat (In background)
Write-Host "Starting Celery beat..."
Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m", "celery", "-A", "tasks.celery_worker", "beat", "--loglevel=info" -NoNewWindow

# Start FastAPI server
Write-Host "Starting FastAPI server..."
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
