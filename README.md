# Pindeck Discord Bot

Same as `pindeck/services/discord-bot` – standalone deploy. Gateway-based bot using `discord.js`. `/images` commands, ingest, queue moderation.

## How it works

- **Gateway**: Long-lived connection to Discord. Registers `/images` and handles interactions, reactions, etc.
- **Commands**: `/images menu`, `/images send`, `/images panel`, `/images import`, `/images review`, `/images approve`, `/images reject`, `/images generate`
- **Ingest**: Emoji reaction triggers import to Pindeck. Links Convex ingest, queue, moderation endpoints.

## Environment

Set these in `.env.local` (or `.env`). Same paths as pindeck: loads `.env.local`, `.env` from cwd, then `../../.env.local`, `../.env.local`, etc., so you can reuse pindeck’s root `.env.local`.

| Variable | Required | Description |
|---------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` or `DISCORD_APPLICATION_ID` | Yes | Application ID |
| `DISCORD_GUILD_ID` | No | Recommended for fast slash command updates |
| `DISCORD_IMAGES_JSON` | No | JSON array of image presets (uses samples if omitted) |
| `DISCORD_INGEST_EMOJIS` | No | Emoji triggers for import (e.g. `📌`) |
| `INGEST_API_KEY` | For ingest | Must match Convex |
| `PINDECK_USER_ID` | For ingest | Convex user id for imports |
| `PINDECK_INGEST_URL` / `CONVEX_SITE_URL` | No | Defaults from Convex URL |
| `PINDECK_DISCORD_QUEUE_URL`, `PINDECK_DISCORD_MODERATION_URL` | No | Queue/moderation endpoints |
| `DISCORD_STATUS_WEBHOOK_URL` | No | Optional status webhook |

## Install and run

```bash
bun install
bun start
```

From pindeck monorepo root you’d run `bun run discord:bot`; here you run `bun start` from this repo.

## Bot invite

- Scopes: `bot`, `applications.commands`
- Permissions: View Channels, Send Messages, Embed Links, Read Message History, Add Reactions, Use Application Commands

## Hostinger deploy

1. Clone, add `.env` or `.env.local` with required vars.
2. GitHub Actions: secrets `HOSTINGER_HOST`, `HOSTINGER_USER`, `HOSTINGER_SSH_KEY`.
3. Push to `main` → workflow builds Docker image and runs the Gateway bot (no HTTP port; connects outbound to Discord).

## Docker

```bash
docker build -t discord-bot-pinterest .
docker run -d --restart unless-stopped --name discord-bot-pinterest -p 8080:8080 --env-file .env discord-bot-pinterest
```

- **Health check**: `GET http://your-server:8080/health` → `{"ok":true,"service":"pindeck-discord-bot"}`. Docker HEALTHCHECK uses this.
