#!/bin/bash

echo "Launch bot in (prod/test) ? "
read ENV

echo "Cleaning previous containers..."
docker-compose down --remove-orphans
docker rmi bot-lol-discord_discord-bot:latest
docker volume prune -f
docker system prune -f 
echo "Containers are cleaned!"

ENV=$(echo "$ENV" | tr '[:upper:]' '[:lower:]')

if [ "$ENV" != "prod" ] && [ "$ENV" != "test" ]; then
  echo "[ERROR]: Type 'test' or 'prod'."
  exit 1
fi

echo "Launching bot in $ENV mode..."

# SELECT BOT TOKEN
if [ "$ENV" = "prod" ]; then
  DISCORD_TOKEN=$(grep "^DISCORD_TOKEN=" .env | cut -d '=' -f2)
else
  DISCORD_TOKEN=$(grep "^DISCORD_TOKEN_TEST=" .env | cut -d '=' -f2)
fi

if [ "$ENV" = "prod" ]; then
  ENVIRONMENT=$ENV DISCORD_TOKEN=$DISCORD_TOKEN docker-compose up --build
else
  ENVIRONMENT=$ENV DISCORD_TOKEN=$DISCORD_TOKEN docker-compose up --build
fi