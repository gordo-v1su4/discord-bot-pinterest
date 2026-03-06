/**
 * Pinterest placeholder and slash command handlers.
 * Extend with OAuth / API calls later.
 */

/**
 * Get Pinterest auth URL stub (for future OAuth).
 * @returns {string}
 */
export function getAuthUrl() {
  const base = process.env.PINTEREST_OAUTH_URL || "https://www.pinterest.com/oauth/";
  const clientId = process.env.PINTEREST_APP_ID || "";
  return clientId ? `${base}?client_id=${clientId}&response_type=code` : "Pinterest OAuth not configured. Set PINTEREST_APP_ID.";
}

/**
 * Handle /pinterest slash command.
 * Subcommands: link (auth URL), info (bot info).
 * @param {object} data - interaction.data (name, options)
 * @returns {{ content: string, ephemeral?: boolean }}
 */
export function handlePinterestCommand(data) {
  const name = data?.name ?? "pinterest";
  const subcommand = data?.options?.[0];
  const subName = subcommand?.name ?? "";
  const options = subcommand?.options ?? [];

  if (subName === "link") {
    const url = getAuthUrl();
    return {
      content: `**Pinterest link**\n${url}\n\n_Add OAuth redirect and token storage to complete the flow._`,
      ephemeral: true,
    };
  }

  if (subName === "info") {
    const appId = process.env.PINTEREST_APP_ID ? "Set" : "Not set";
    return {
      content: `**Pinterest bot**\n• \`PINTEREST_APP_ID\`: ${appId}\n• \`PINTEREST_OAUTH_URL\`: ${process.env.PINTEREST_OAUTH_URL || "(default)"}\n\n_Placeholder; extend with Pinterest API as needed._`,
      ephemeral: true,
    };
  }

  return {
    content: "Use `/pinterest link` to get the auth URL or `/pinterest info` for config status.",
    ephemeral: true,
  };
}
