# Deploy on a single EC2 instance (complete step-by-step)

This document explains, in full detail, how to deploy this repository as a working demo on a single AWS EC2 instance using Docker Compose and a simple GitHub Actions workflow that SSH-deploys to the EC2 host.

Overview
- Goal: run backend (FastAPI), frontend (Next.js standalone), Redis (Celery broker), and a Celery worker on one EC2 host. Caddy provides HTTPS and serves `trialscope.strangelytrue.dev`.
- Technique: build & run containers on EC2 via `docker compose --profile caddy up -d --build`. Use a GitHub Actions workflow to push updates by SSH.
- Not production-grade. Suitable for quick demos or staging.

Table of contents
- Prerequisites
- Networking & Security Groups
- Launch EC2 (console & CLI examples)
- Bootstrap EC2 (install Docker, Docker Compose)
- Repo setup and `.env`
- `docker-compose.yml` and `Caddyfile` notes
- Run the stack
- Run migrations
- Verify & troubleshooting
- GitHub Actions CI/CD configuration
- DNS and TLS
- Updating / rollback
- Security & operational notes

1. Prerequisites
- AWS account with permissions to create Security Groups, EC2, and Elastic IPs.
- RDS instance already created (hostname, database name, username, password available).
- SSH key pair (private key on your machine). Example user: `ubuntu` for Ubuntu AMIs.
- (Optional) A domain name for TLS.
- On your laptop: `ssh`, `git`, and (optionally) `aws` CLI and `gh` CLI if using GitHub CLI.

2. Networking & Security Groups (recommended)
Why: EC2 must be able to reach your RDS privately; restrict inbound to least privilege.

Console steps (recommended for clarity):
- Create a security group `trialgo-ec2-sg` in the same VPC as RDS.
- Inbound rules:
  - SSH (TCP 22): Source = your.IP/32 (restrict to your IP)
  - HTTP (TCP 80): Source = 0.0.0.0/0
  - HTTPS (TCP 443): Source = 0.0.0.0/0
- Outbound: allow all (default).
- Edit the RDS security group to add an inbound rule allowing `trialgo-ec2-sg` on port 5432 (Postgres).

AWS CLI example (replace placeholders):
```bash
# create SG
aws ec2 create-security-group --group-name trialgo-ec2-sg --description "EC2 for trialgo demo" --vpc-id <VPC_ID>
# allow SSH from your IP
aws ec2 authorize-security-group-ingress --group-name trialgo-ec2-sg --protocol tcp --port 22 --cidr YOUR.IP.ADDR.0/32
# allow HTTP/HTTPS
aws ec2 authorize-security-group-ingress --group-name trialgo-ec2-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name trialgo-ec2-sg --protocol tcp --port 443 --cidr 0.0.0.0/0
```

3. Launch EC2 (console)
- AMI: Ubuntu Server 22.04 LTS (or 20.04 LTS). This guide uses `ubuntu` user.
- Instance type: `t3.small` (demo) or `t3.micro` (cheaper, may be slow).
- Network: choose the same VPC where your RDS is.
- Subnet: pick a subnet with internet access (public) if you want to reach it from the Internet.
- Auto-assign Public IP: enabled (so Caddy can do Let's Encrypt if using domain and the EC2 has a public IP).
- Security Group: attach `trialgo-ec2-sg`.
- Key pair: select an existing key pair (so you can SSH in).

CLI example to launch (very minimal):
```bash
# create a minimal instance (replace placeholders)
aws ec2 run-instances --image-id <AMI_ID> --instance-type t3.small --key-name YourKeyPair --security-group-ids <SG_ID> --subnet-id <SUBNET_ID> --associate-public-ip-address
```

Allocate and associate an Elastic IP (optional but recommended):
```bash
aws ec2 allocate-address --domain vpc
# then associate with instance ID
aws ec2 associate-address --instance-id <INSTANCE_ID> --allocation-id <ALLOCATION_ID>
```

4. SSH to EC2 and bootstrap (install Docker and Compose)
SSH:
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Install steps (run as `ubuntu` user, or use sudo):
```bash
sudo apt update
sudo apt install -y git curl
sudo apt install -y docker.io
sudo systemctl enable --now docker
sudo apt install -y docker-compose-plugin
# allow the ubuntu user to run docker (log out/reconnect or run newgrp)
sudo usermod -aG docker $USER
newgrp docker

# verify
docker --version
docker compose version
```

Optional: install `docker` from Docker's repo for latest versions — the above is sufficient for the demo.

5. Repo setup and `.env` (on the EC2 host)
Clone the repo (or let GitHub Actions clone it automatically):
```bash
git clone https://github.com/strangely-true/trialscope-technoverse.git
cd trialscope-technoverse
```

Create `.env` in the repo root. Use the provided `.env.example` as a template. Example:
```text
DATABASE_URL=postgresql://DB_USER:DB_PASS@your-rds-endpoint:5432/DB_NAME
REDIS_URL=redis://redis:6379/0
JWT_SECRET=replace-with-a-random-secret
INTERNAL_API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=https://your-domain.example
NEXT_TELEMETRY_DISABLED=1
```
Notes on `DATABASE_URL`:
- Use the standard SQLAlchemy/psycopg2 Postgres URL. If your RDS enforces SSL, append `?sslmode=require` or set an appropriate SSL mode.

6. `docker-compose.yml` and reverse proxy
You already have a `docker-compose.yml` added to the repo. It starts `redis`, `backend`, `worker`, and `frontend`. When the `caddy` profile is enabled, it also starts a `caddy` reverse proxy that serves `trialscope.strangelytrue.dev` and forwards `/api/*` to the backend.

Example `Caddyfile` for path-based routing (replace `your-domain.example`):
```text
trialscope.strangelytrue.dev {
  handle_path /api/* {
    reverse_proxy http://backend:8000
  }
  handle {
    reverse_proxy http://frontend:3000
  }
}
```

If you don't have a domain, you can skip Caddy and access services via the EC2 public IP and exposed ports (HTTP only).

7. Start the stack
From the repo root on EC2:
```bash
docker compose --profile caddy up -d --build
```
This builds images locally on the EC2 host and starts containers. The `-d` runs in detached mode.

8. Run database migrations
Prefer running Alembic for migrations. If `alembic` is installed in your container, run:
```bash
docker compose run --rm backend alembic upgrade head
```
If alembic isn't wired to run in this image, the `backend/start.py` script attempts to create tables on start. Check the logs if migrations fail.

9. Verify services and logs
```bash
docker ps
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend
docker compose logs -f redis
```
- Visit `http://<EC2_PUBLIC_IP>:3000` (frontend) and `http://<EC2_PUBLIC_IP>:8000/docs` (backend docs).
- If using Caddy and a domain, open `https://trialscope.strangelytrue.dev`.

10. GitHub Actions CI/CD (already added)
File: `.github/workflows/deploy-ec2.yml` — this workflow SSHs into your EC2 host and deploys the repo using `docker compose --profile caddy up -d --build`.

Required GitHub repository secrets (set in Settings → Secrets → Actions):
- `EC2_HOST` — EC2 public IP or DNS (Elastic IP recommended).
- `EC2_USER` — SSH user (e.g., `ubuntu`).
- `EC2_SSH_PRIVATE_KEY` — the private key PEM content (no passphrase). Keep this secret!
- `DATABASE_URL` — the RDS URL (same as used by `.env`).
- `REDIS_URL` — optional (if using local redis keep `redis://redis:6379/0`).
- `JWT_SECRET` — JWT signing secret.
- `NEXT_PUBLIC_API_URL` — public URL for the frontend.
- `TRIALGO_DOMAIN` — `trialscope.strangelytrue.dev`.

How the workflow works (summary):
- SSHs to EC2 as the `EC2_USER` using `EC2_SSH_PRIVATE_KEY`.
- Clones or updates the repository in `~/trialscope-technoverse`.
- Writes a `.env` file with the GitHub secret values.
- Writes a `Caddyfile` for `trialscope.strangelytrue.dev`.
- Runs `docker compose --profile caddy down` and `docker compose --profile caddy up -d --build` to rebuild and restart containers.

Triggering deploys:
- Any push to `main` triggers the workflow.
- For manual deploys use `Actions` → the workflow → `Run workflow` and provide inputs if necessary (or just push a commit).

11. DNS and TLS (if you have a domain)
1. Create A record(s) in your DNS provider pointing to the Elastic IP of the EC2 instance:
  - `trialscope.strangelytrue.dev` → `<ELASTIC_IP>`
2. If using `Caddy`, it will automatically obtain TLS certificates for the domain via Let's Encrypt. Make sure ports 80 and 443 are open and domain resolves to the Elastic IP.

12. Update / rollback
- Update code: push to `main` → GitHub Actions will SSH and redeploy.
- Rollback: SSH to EC2, cd to `~/trialscope-technoverse` and run:
```bash
git fetch --all
git checkout <previous-commit-or-tag>
docker compose --profile caddy up -d --build
```

13. Troubleshooting checklist
- Backend fails to start (DB connection errors):
  - Check `DATABASE_URL` in `.env` and RDS security group.
  - Check RDS is publicly accessible? (Prefer private VPC access.)
- Celery worker shows broker errors:
  - Ensure `REDIS_URL` is `redis://redis:6379/0` when using local redis container.
  - `docker compose logs -f redis` to inspect redis.
- Caddy fails to get certificate:
  - Verify DNS A record points to EC2 Elastic IP.
  - Ensure port 80 is reachable and not blocked by a cloud firewall.
- Images fail to build:
  - Inspect `docker compose logs --no-log-prefix --tail=200 backend` and `frontend` logs.

14. Security & operational notes (important)
- This single-EC2 setup stores secrets in `~/.env` on the instance; consider using AWS Secrets Manager for production.
- Redis on the same host is not durable nor highly available — for production use ElastiCache.
- Exposing SSH publicly risks compromise — keep SSH restricted to your IP and consider using AWS Systems Manager Session Manager.
- Backup: RDS snapshots are recommended. Also snapshot important volumes if you store persistent data outside RDS.

15. Optional: EC2 user-data bootstrap
You can provide this as the EC2 user-data to install Docker and clone the repo on first boot. You still need to create `.env` manually or let GitHub Actions write it.
```bash
#!/bin/bash
apt update
apt install -y git curl docker.io docker-compose-plugin
usermod -aG docker ubuntu
cd /home/ubuntu
git clone https://github.com/strangely-true/trialscope-technoverse.git
chown -R ubuntu:ubuntu trialscope-technoverse
```

16. Final quick commands (cheat-sheet)
- On EC2 to start everything now:
```bash
cd ~/trialscope-technoverse
cp .env.example .env   # edit .env with real values
docker compose --profile caddy up -d --build
docker compose run --rm backend alembic upgrade head
```

---

If you want, I can now:
- Add a production-ready EC2 `user-data` script that also writes `.env` from AWS SSM (requires IAM role).
- Modify the GitHub Actions workflow to build images in CI and push to ECR, then pull images on EC2 (recommended long-term).
- Create a small `ec2-bootstrap.sh` file in the repo.

Tell me which of those you'd like next.
