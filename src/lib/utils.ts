/**
 * Discord utility functions
 */

/**
 * Validate Discord snowflake ID
 */
export function isValidDiscordId(id: string): boolean {
  return /^\d{17,21}$/.test(id);
}

/**
 * Validate multiple Discord IDs
 */
export function validateDiscordIds(ids: string[]): boolean {
  return ids.every(isValidDiscordId);
}

/**
 * Get Discord CDN URL for an attachment
 */
export function getAttachmentUrl(channelId: string, attachmentId: string, filename: string): string {
  return `https://cdn.discordapp.com/attachments/${channelId}/${attachmentId}/${filename}`;
}

/**
 * Convert Discord CDN URL to proxy URL when possible
 * This helps with loading performance and avoids direct CDN access issues
 */
export function getDiscordProxyUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    
    // Only process Discord CDN URLs
    if (urlObj.hostname === 'cdn.discordapp.com') {
      // Convert cdn.discordapp.com to media.discordapp.net for proxy
      urlObj.hostname = 'media.discordapp.net';
      return urlObj.toString();
    }
    
    // Return original URL if not a Discord CDN URL or already a proxy URL
    return url;
  } catch {
    // If URL parsing fails, return original URL
    return url;
  }
}

/**
 * Get a larger version of a Discord CDN image URL by adding size parameter
 */
export function getLargerDiscordImageUrl(url: string | undefined, size: number = 2048): string | undefined {
  if (!url) return url;

  // Check if it's a Discord CDN URL
  const isDiscordCdn = url.includes("cdn.discordapp.com") || url.includes("media.discordapp.net");

  if (!isDiscordCdn) return url;

  try {
    // Parse the URL
    const urlObj = new URL(url);

    // If this is a proxy URL with authentication parameters, don't modify it
    // Proxy URLs typically have parameters like ex, is, hm that are for authentication
    if (urlObj.hostname === "media.discordapp.net" && 
        (urlObj.searchParams.has("ex") || urlObj.searchParams.has("is") || urlObj.searchParams.has("hm"))) {
      // This is likely a proxy URL with authentication, return as-is
      return url;
    }

    // Add or update the size parameter for regular CDN URLs
    urlObj.searchParams.set("size", size.toString());
    
    // remove width and height parameters if they exist
    urlObj.searchParams.delete("width");
    urlObj.searchParams.delete("height");

    // remove quality parameters if they exist
    urlObj.searchParams.delete("quality");

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original URL
    return url;
  }
}

/**
 * Determine if a URL points to an image.
 */
export function isImageUrl(url: string): boolean {
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();

  const dynamicContentHosts = [
    'tenor.com',
    'giphy.com',
    'youtube.com',
    'youtu.be',
    'twitter.com',
    'x.com',
    'tiktok.com',
  ];
  if (dynamicContentHosts.some((host) => url.includes(host))) {
    return false;
  }

  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg', '.gif'];
  if (imageExtensions.some((ext) => cleanUrl.endsWith(ext))) {
    return true;
  }

  if (url.includes('cdn.discordapp.com') || url.includes('media.discordapp.net')) {
    return (
      !!cleanUrl.match(/\.(png|jpg|jpeg|webp|bmp|svg|gif)$/i) ||
      url.includes('format=webp') ||
      url.includes('format=png') ||
      url.includes('format=jpg') ||
      url.includes('format=jpeg') ||
      url.includes('format=gif') ||
      url.includes('size=')
    );
  }

  const imageHosts = ['i.imgur.com', 'imgur.com/i/', 'i.gyazo.com'];
  return (
    imageHosts.some((host) => url.includes(host)) &&
    imageExtensions.some((ext) => cleanUrl.endsWith(ext))
  );
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Convert Discord permission number to readable permissions
 */
export function parsePermissions(permissions: number): string[] {
  const PERMISSIONS = {
    CREATE_INSTANT_INVITE: 1 << 0,
    KICK_MEMBERS: 1 << 1,
    BAN_MEMBERS: 1 << 2,
    ADMINISTRATOR: 1 << 3,
    MANAGE_CHANNELS: 1 << 4,
    MANAGE_GUILD: 1 << 5,
    ADD_REACTIONS: 1 << 6,
    VIEW_AUDIT_LOG: 1 << 7,
    PRIORITY_SPEAKER: 1 << 8,
    STREAM: 1 << 9,
    VIEW_CHANNEL: 1 << 10,
    SEND_MESSAGES: 1 << 11,
    SEND_TTS_MESSAGES: 1 << 12,
    MANAGE_MESSAGES: 1 << 13,
    EMBED_LINKS: 1 << 14,
    ATTACH_FILES: 1 << 15,
    READ_MESSAGE_HISTORY: 1 << 16,
    MENTION_EVERYONE: 1 << 17,
    USE_EXTERNAL_EMOJIS: 1 << 18,
    VIEW_GUILD_INSIGHTS: 1 << 19,
    CONNECT: 1 << 20,
    SPEAK: 1 << 21,
    MUTE_MEMBERS: 1 << 22,
    DEAFEN_MEMBERS: 1 << 23,
    MOVE_MEMBERS: 1 << 24,
    USE_VAD: 1 << 25,
    CHANGE_NICKNAME: 1 << 26,
    MANAGE_NICKNAMES: 1 << 27,
    MANAGE_ROLES: 1 << 28,
    MANAGE_WEBHOOKS: 1 << 29,
    MANAGE_EMOJIS_AND_STICKERS: 1 << 30,
  };

  return Object.entries(PERMISSIONS)
    .filter(([, bit]) => (permissions & bit) === bit)
    .map(([name]) => name);
}

/**
 * Check if a message has the HAS_SNAPSHOT flag
 */
export function hasSnapshotFlag(flags: number): boolean {
  const HAS_SNAPSHOT = 1 << 14; // 16384
  return !!(flags & HAS_SNAPSHOT);
}

/**
 * Check if a message is a forwarded message
 */
export function isForwardedMessage(message: { flags?: number }): boolean {
  return !!(message.flags && hasSnapshotFlag(message.flags));
}

/**
 * Get message type name from message type number
 */
export function getMessageTypeName(type: number): string {
  const messageTypes: Record<number, string> = {
    0: "DEFAULT",
    1: "RECIPIENT_ADD",
    2: "RECIPIENT_REMOVE",
    3: "CALL",
    4: "CHANNEL_NAME_CHANGE",
    5: "CHANNEL_ICON_CHANGE",
    6: "CHANNEL_PINNED_MESSAGE",
    7: "USER_JOIN",
    8: "GUILD_BOOST",
    9: "GUILD_BOOST_TIER_1",
    10: "GUILD_BOOST_TIER_2",
    11: "GUILD_BOOST_TIER_3",
    12: "CHANNEL_FOLLOW_ADD",
    14: "GUILD_DISCOVERY_DISQUALIFIED",
    15: "GUILD_DISCOVERY_REQUALIFIED",
    16: "GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING",
    17: "GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING",
    18: "THREAD_CREATED",
    19: "REPLY",
    20: "CHAT_INPUT_COMMAND",
    21: "THREAD_STARTER_MESSAGE",
    22: "GUILD_INVITE_REMINDER",
    23: "CONTEXT_MENU_COMMAND",
    24: "AUTO_MODERATION_ACTION",
    25: "ROLE_SUBSCRIPTION_PURCHASE",
    26: "INTERACTION_PREMIUM_UPSELL",
    27: "STAGE_START",
    28: "STAGE_END",
    29: "STAGE_SPEAKER",
    31: "STAGE_TOPIC",
    32: "GUILD_APPLICATION_PREMIUM_SUBSCRIPTION",
  };

  return messageTypes[type] || "UNKNOWN";
}
