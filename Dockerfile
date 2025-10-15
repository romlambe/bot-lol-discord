FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

RUN mkdir -p /app/data

# Build TypeScript
# RUN npm install -g typescript
# RUN npx tsc

ENV NODE_ENV=production

# Run the bot
CMD ["npx", "ts-node", "src/index.ts"]
