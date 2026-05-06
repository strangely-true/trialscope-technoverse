"""Startup script: create tables then launch uvicorn."""
import time
import sys

for attempt in range(5):
    try:
        from db.database import engine, Base
        import models.models
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully")
        break
    except Exception as e:
        print(f"DB init attempt {attempt + 1} failed: {e}")
        time.sleep(3)
else:
    print("WARNING: Could not create tables after 5 attempts, starting anyway...")

# Start uvicorn
import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=8000, ws="websockets")
