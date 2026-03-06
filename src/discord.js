/**
 * Discord HTTP interaction helpers: verify request signature and build reply payloads.
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding
 */

import nacl from "tweetnacl";

const INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
};

const INTERACTION_RESPONSE_TYPE = {
  PONG: 1,
  CHANNEL_MESSAGE: 4,
  DEFERRED_CHANNEL_MESSAGE: 5,
};

/**
 * Verify Discord interaction request using X-Signature-Ed25519 and X-Signature-Timestamp.
 * @param {string} rawBody - Raw request body (must be string, not parsed JSON)
 * @param {string} signature - Header X-Signature-Ed25519 (hex)
 * @param {string} timestamp - Header X-Signature-Timestamp
 * @param {string} publicKey - Discord application public key (hex)
 * @returns {boolean}
 */
export function verifySignature(rawBody, signature, timestamp, publicKey) {
  if (!rawBody || !signature || !timestamp || !publicKey) return false;
  try {
    const message = Buffer.from(timestamp + rawBody, "utf8");
    const sig = Buffer.from(signature, "hex");
    const key = Buffer.from(publicKey, "hex");
    return nacl.sign.detached.verify(message, sig, key);
  } catch {
    return false;
  }
}

/**
 * Build JSON response for Discord PING (type 1).
 */
export function pong() {
  return { type: INTERACTION_RESPONSE_TYPE.PONG };
}

/**
 * Build JSON response for an immediate channel message (type 4).
 * @param {string} content - Message text
 * @param {boolean} [ephemeral] - Only visible to the user who triggered
 */
export function channelMessage(content, ephemeral = false) {
  return {
    type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE,
    data: {
      content: String(content),
      flags: ephemeral ? 64 : 0,
    },
  };
}

/**
 * Build JSON response for deferred channel message (type 5). Use follow-up later via REST.
 * @param {boolean} [ephemeral]
 */
export function deferredMessage(ephemeral = false) {
  return {
    type: INTERACTION_RESPONSE_TYPE.DEFERRED_CHANNEL_MESSAGE,
    data: {
      flags: ephemeral ? 64 : 0,
    },
  };
}

/**
 * Parse interaction type and command/options from the payload.
 * @param {object} body - Parsed JSON interaction payload
 * @returns {{ type: number, data?: object, id?: string, token?: string }}
 */
export function parseInteraction(body) {
  const { type, data, id, token } = body || {};
  return {
    type: type ?? 0,
    data,
    id,
    token,
  };
}

export { INTERACTION_TYPE, INTERACTION_RESPONSE_TYPE };
