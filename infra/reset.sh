#!/bin/bash
set -e

HOME_DIR="$HOME"
SYNAP_DIR="${HOME_DIR}/SynapsisForge"

cd "$SYNAP_DIR" || {
  echo "❌ SynapsisForge directory not found at $SYNAP_DIR"
  exit 1
}

ENV_FILE="${SYNAP_DIR}/.env.production"
COMPOSE_FILE=infra/docker-compose.prod.yml
LOG="${HOME_DIR}/reset.log"

echo "[$(date)] 🔄 SynapsisForge — Full site reset" | tee -a "$LOG"

# ── Load AWS/S3 credentials from .env.production (safe: no shell eval) ────────
# Avoids 'source' which breaks on passwords with spaces
load_env_val() {
  local key="$1"
  grep -m1 "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | sed 's/^"//; s/"$//'
}

S3_MEDIA_BUCKET=$(load_env_val S3_MEDIA_BUCKET)
export S3_MEDIA_BUCKET
S3_PRIVATE_BUCKET=$(load_env_val S3_PRIVATE_BUCKET)
export S3_PRIVATE_BUCKET

AWS_ACCESS_KEY_ID=$(load_env_val AWS_ACCESS_KEY_ID)
export AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$(load_env_val AWS_SECRET_ACCESS_KEY)
export AWS_SECRET_ACCESS_KEY
AWS_REGION=$(load_env_val AWS_REGION)
export AWS_REGION

# ── Stop everything and remove all volumes ──────────────────────────────────
echo "→ Stopping services and removing volumes..." | tee -a "$LOG"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v >> "$LOG" 2>&1

# ── Clean S3 buckets ─────────────────────────────────────────────────────────
if command -v aws &> /dev/null && [ -n "$AWS_ACCESS_KEY_ID" ]; then
  echo "→ Cleaning S3 buckets..." | tee -a "$LOG"
  aws s3 rm "s3://${S3_MEDIA_BUCKET:-synapsisforge-media}" --recursive >> "$LOG" 2>&1 || true
  aws s3 rm "s3://${S3_PRIVATE_BUCKET:-synapsisforge-private}" --recursive >> "$LOG" 2>&1 || true
else
  echo "⚠️  AWS CLI not available or no credentials — skipping S3 cleanup" | tee -a "$LOG"
fi

# ── Pull latest app images ──────────────────────────────────────────────────
echo "→ Pulling latest images..." | tee -a "$LOG"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull backend frontend >> "$LOG" 2>&1

# ── Start databases ─────────────────────────────────────────────────────────
echo "→ Starting databases..." | tee -a "$LOG"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres mongodb --wait >> "$LOG" 2>&1

# ── Schema sync + seed ──────────────────────────────────────────────────────
echo "→ Running schema sync..." | tee -a "$LOG"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend \
  node node_modules/.bin/typeorm schema:sync -d dist/data-source.js >> "$LOG" 2>&1

echo "→ Running seed..." | tee -a "$LOG"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend \
  node dist/database/seeds/seed.js >> "$LOG" 2>&1

# ── Upload single test video to S3 ──────────────────────────────────────────
if command -v aws &> /dev/null && [ -n "$AWS_ACCESS_KEY_ID" ]; then
  echo "→ Uploading test video to S3..." | tee -a "$LOG"
  S3_KEY="videos/big_buck_bunny_720_10s_1mb.mp4"
  LOCAL_VIDEO="${SYNAP_DIR}/test-video.mp4"
  if [ -f "$LOCAL_VIDEO" ]; then
    aws s3 cp "$LOCAL_VIDEO" "s3://${S3_MEDIA_BUCKET:-synapsisforge-media}/${S3_KEY}" \
      --content-type video/mp4 >> "$LOG" 2>&1 && \
      echo "✅ Test video uploaded from local file to s3://${S3_MEDIA_BUCKET:-synapsisforge-media}/${S3_KEY}" | tee -a "$LOG"
  else
    echo "⚠️  Local test video not found at $LOCAL_VIDEO — skipping S3 upload" | tee -a "$LOG"
  fi
else
  echo "⚠️  AWS CLI not available — skipping S3 video upload" | tee -a "$LOG"
fi

# ── Start all services ─────────────────────────────────────────────────────
echo "→ Starting all services..." | tee -a "$LOG"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d >> "$LOG" 2>&1

# ── Health check ────────────────────────────────────────────────────────────
echo "→ Waiting for backend..." | tee -a "$LOG"
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend healthy" | tee -a "$LOG"
    break
  fi
  sleep 5
done
curl -sf http://localhost:3000/health > /dev/null 2>&1 || {
  echo "❌ Backend health check failed" | tee -a "$LOG"
  exit 1
}

# ── Clean up ────────────────────────────────────────────────────────────────
docker image prune -f >> "$LOG" 2>&1

echo "[$(date)] ✅ Reset complete" | tee -a "$LOG"
