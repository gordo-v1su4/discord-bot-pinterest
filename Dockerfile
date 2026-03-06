FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src/ ./src/

EXPOSE 8080
ENV PORT=8080
CMD ["bun", "run", "src/index.js"]
