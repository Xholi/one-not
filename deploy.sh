#!/usr/bin/env bash
set -euo pipefail

DOCKER_USER=${1:-yourdockerhubusername}
REMOTE_HOST=${2:-your.server.ip}
REMOTE_USER=${3:-deploy}
IMAGE_TAG=${4:-latest}

echo "Building images..."
docker build -t ${DOCKER_USER}/hookup-server:${IMAGE_TAG} -f apps/server/Dockerfile .
docker build -t ${DOCKER_USER}/hookup-web:${IMAGE_TAG} -f apps/web/Dockerfile .

echo "Pushing to Docker Hub..."
docker push ${DOCKER_USER}/hookup-server:${IMAGE_TAG}
docker push ${DOCKER_USER}/hookup-web:${IMAGE_TAG}

echo "Deploying to remote host ${REMOTE_HOST}..."
ssh ${REMOTE_USER}@${REMOTE_HOST} <<'SSH'
  set -e
  cd ~/hookup-deploy || mkdir -p ~/hookup-deploy && cd ~/hookup-deploy
  docker pull ${DOCKER_USER}/hookup-server:${IMAGE_TAG}
  docker pull ${DOCKER_USER}/hookup-web:${IMAGE_TAG}
  docker compose -f docker-compose.prod.yml down || true
  docker compose -f docker-compose.prod.yml up -d --remove-orphans
SSH

echo "Deployment complete."
