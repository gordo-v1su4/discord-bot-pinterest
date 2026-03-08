FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src/ ./src/

# Gateway bot – connects to Discord, no HTTP server
CMD ["bun", "src/index.js"]
