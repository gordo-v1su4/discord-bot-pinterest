/**
 * HTTP server for Discord interactions (slash commands, components).
 * Cloud Run: set PORT; bind 0.0.0.0. No Gateway; scale-to-zero friendly.
 */

import { createServer } from "node:http";
import {
  verifySignature,
  parseInteraction,
  pong,
  channelMessage,
  INTERACTION_TYPE,
} from "./discord.js";
import { handlePinterestCommand } from "./pinterest.js";

const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || "";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res, statusCode, body, contentType = "application/json") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function handleInteraction(rawBody, signature, timestamp) {
  if (!DISCORD_PUBLIC_KEY) {
    return { status: 500, body: { error: "DISCORD_PUBLIC_KEY not set" } };
  }
  if (!verifySignature(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY)) {
    return { status: 401, body: "invalid request signature" };
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: "invalid JSON" };
  }

  const { type, data } = parseInteraction(body);

  if (type === INTERACTION_TYPE.PING) {
    return { status: 200, body: pong() };
  }

  if (type === INTERACTION_TYPE.APPLICATION_COMMAND) {
    const name = data?.name ?? "";
    if (name === "pinterest") {
      const result = handlePinterestCommand(data);
      return {
        status: 200,
        body: channelMessage(result.content, result.ephemeral ?? true),
      };
    }
    return {
      status: 200,
      body: channelMessage(`Unknown command: \`/${name}\`.`, true),
    };
  }

  if (type === INTERACTION_TYPE.MESSAGE_COMPONENT) {
    return {
      status: 200,
      body: channelMessage("Component handling not implemented yet.", true),
    };
  }

  return { status: 200, body: channelMessage("Unhandled interaction type.", true) };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const method = req.method || "GET";

  if (method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    send(res, 200, JSON.stringify({ ok: true, service: "discord-bot-pinterest" }));
    return;
  }

  if (method === "POST" && (url.pathname === "/" || url.pathname === "/interactions")) {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    const rawBody = await readBody(req);
    const result = await handleInteraction(rawBody, signature, timestamp);
    send(res, result.status, result.body);
    return;
  }

  send(res, 404, JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, HOST, () => {
  console.log(`discord-bot-pinterest listening on http://${HOST}:${PORT}`);
});
