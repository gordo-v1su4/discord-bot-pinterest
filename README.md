# discord-bot-pinterest

Discord bot that handles interactions over HTTP (slash commands, components). Docker-ready and deployable to **Google Cloud Run** (scale-to-zero, dormant until Discord sends a request) or **Hostinger** (always-on container).

## How it works

- **No Gateway**: Discord sends a `POST` to your URL when a user runs `/pinterest` or clicks a component. The server responds with JSON. No long-lived WebSocket.
- **Verification**: Requests are verified using `X-Signature-Ed25519` and `X-Signature-Timestamp` with your application public key.

## Local run

1. Copy env and set Discord public key (required):

   ```bash
   cp .env.example .env
   # Edit .env: set DISCORD_PUBLIC_KEY (from Discord Developer Portal → Application → General Information)
   ```

2. Install and start:

   ```bash
   npm install
   npm start
   ```

   Server listens on `http://0.0.0.0:8080` (or `PORT` from env).  
   - `GET /` or `GET /health` → 200 OK (for health checks).  
   - `POST /` or `POST /interactions` → Discord interaction payload (raw body used for signature verification).

## Register slash command

Register the `/pinterest` command once (e.g. after deploy so Discord knows your URL):

1. In [Discord Developer Portal](https://discord.com/developers/applications) → your application → **Slash Commands** (or use the API).
2. Create command:
   - Name: `pinterest`
   - Subcommands: `link` (get auth URL), `info` (config status).

Or use Discord REST API:

```bash
# Requires DISCORD_APPLICATION_ID and DISCORD_TOKEN in .env
curl -X PUT "https://discord.com/api/v10/applications/$DISCORD_APPLICATION_ID/commands" \
  -H "Authorization: Bot $DISCORD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"name":"pinterest","description":"Pinterest helpers","options":[{"name":"link","type":1,"description":"Get Pinterest auth URL"},{"name":"info","type":1,"description":"Show config status"}]}]'
```

## Docker

Build:

```bash
docker build -t discord-bot-pinterest .
```

Run locally:

```bash
docker run -p 8080:8080 \
  -e DISCORD_PUBLIC_KEY=your_public_key_hex \
  -e DISCORD_APPLICATION_ID=your_app_id \
  discord-bot-pinterest
```

## Deploy to Google Cloud Run

1. Build and deploy (replace `YOUR_REGION` and project):

   ```bash
   gcloud run deploy discord-bot-pinterest --source . --region YOUR_REGION --allow-unauthenticated
   ```

2. Set environment variables in Cloud Run (Console or `gcloud run services update`):
   - `DISCORD_PUBLIC_KEY` (required)
   - `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN` (optional)
   - `PINTEREST_APP_ID`, `PINTEREST_OAUTH_URL` (optional)

3. In Discord Developer Portal → your application → **General Information** → **Interactions Endpoint URL**: set to your Cloud Run URL (e.g. `https://discord-bot-pinterest-xxxxx.run.app`). Discord will send all interactions to this URL. The container is **dormant until a request hits it** (scale-to-zero).

## Hostinger (always-on)

On a Hostinger VPS you can run the same image as a long-lived container (no scale-to-zero).

### One-time server setup

1. On the Hostinger VPS ensure **Docker** and **Git** are installed.
2. Clone this repo (replace with your repo URL):
   ```bash
   git clone https://github.com/YOUR_USER/discord-bot-pinterest.git ~/discord-bot-pinterest
   cd ~/discord-bot-pinterest
   cp .env.example .env
   # Edit .env and set DISCORD_PUBLIC_KEY, etc.
   ```
3. Add your server’s SSH public key to the repo (or use a deploy key) so the server can `git pull` from GitHub.

### GitHub Actions (auto-deploy on push to main)

1. In the **discord-bot-pinterest** GitHub repo go to **Settings → Secrets and variables → Actions**.
2. Add these repository secrets:
   - **HOSTINGER_HOST** – VPS hostname or IP (e.g. `srv123.hostinger.com` or `123.45.67.89`).
   - **HOSTINGER_USER** – SSH user (e.g. `root` or `u123456789`).
   - **HOSTINGER_SSH_KEY** – Full contents of the **private** SSH key that can log in as that user (paste the entire key including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`).
3. Optional: **DISCORD_PUBLIC_KEY** – If you don’t use a `.env` file on the server, the workflow can pass this into the container (see workflow file).
4. Push to **main**. The workflow [.github/workflows/deploy-hostinger.yml](.github/workflows/deploy-hostinger.yml) runs: SSH into the VPS, `git pull`, `docker build`, then `docker run` with `--restart unless-stopped`. The app directory on the server must already exist (clone it once as in “One-time server setup” above). Default path is `~/discord-bot-pinterest`; to use another path, add a secret **HOSTINGER_APP_PATH** and set `env` in the workflow so the script can use it, or edit the path in the workflow file.

### Manual run (no CI)

```bash
docker run -d --restart unless-stopped -p 8080:8080 \
  -e DISCORD_PUBLIC_KEY=... \
  -e DISCORD_APPLICATION_ID=... \
  discord-bot-pinterest
```

Use a reverse proxy (e.g. nginx) and point your domain to the VPS; then set the **Interactions Endpoint URL** in Discord to `https://your-domain.com`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_PUBLIC_KEY` | Yes | Application public key (hex), for request verification |
| `DISCORD_APPLICATION_ID` | No | Application ID (for registering commands) |
| `DISCORD_TOKEN` | No | Bot token (for follow-up or command registration) |
| `PORT` | No | Server port (default 8080) |
| `PINTEREST_APP_ID` | No | Pinterest app ID (for `/pinterest link`) |
| `PINTEREST_OAUTH_URL` | No | Pinterest OAuth base URL (default Pinterest OAuth) |
