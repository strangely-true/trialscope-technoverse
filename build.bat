@echo off
cd /d "C:\Users\biswa\OneDrive\Desktop\trialscope-technoverse"
docker compose down
docker compose build --no-cache
docker compose up -d
timeout /t 60
docker compose ps
