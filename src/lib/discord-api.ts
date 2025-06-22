// Discord API types and utilities for fetching Discord data

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string;
}

// Basic Discord message types - only what we need
export enum DiscordMessageType {
  DEFAULT = 0,
  REPLY = 19,
}

// Message flags for special message types
export enum DiscordMessageFlags {
  CROSSPOSTED = 1 << 0,
  IS_CROSSPOST = 1 << 1,
  HAS_SNAPSHOT = 1 << 14, // For forwarded messages
}

export interface DiscordMember {
  user: DiscordUser;
  nick?: string;
  roles: string[];
  avatar?: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number;
  width?: number;
}

export enum DiscordStickerType {
  STANDARD = 1,
  GUILD = 2,
}

export enum DiscordStickerFormatType {
  PNG = 1,
  APNG = 2,
  LOTTIE = 3,
  GIF = 4,
}

export interface DiscordSticker {
  id: string;
  pack_id?: string;
  name: string;
  description?: string;
  tags: string;
  type: DiscordStickerType;
  format_type: DiscordStickerFormatType;
  available?: boolean;
  guild_id?: string;
  user?: DiscordUser;
  sort_value?: number;
}

export interface DiscordStickerItem {
  id: string;
  name: string;
  format_type: DiscordStickerFormatType;
}

export interface DiscordEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  thumbnail?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  video?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
    placeholder?: string;
    placeholder_version?: number;
    flags?: number;
  };
  provider?: {
    name?: string;
    url?: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

export interface DiscordMessageReference {
  message_id?: string;
  channel_id?: string;
  guild_id?: string;
  fail_if_not_exists?: boolean;
}

export interface DiscordMessageSnapshot {
  message: DiscordMessage;
}

export interface DiscordMessage {
  id: string;
  type: number;
  content: string;
  channel_id: string;
  author: DiscordUser;
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
  mentions: DiscordUser[];
  mention_roles: string[];
  pinned: boolean;
  mention_everyone: boolean;
  tts: boolean;
  timestamp: string;
  edited_timestamp?: string;
  flags?: number;
  message_reference?: DiscordMessageReference;
  referenced_message?: DiscordMessage;
  message_snapshots?: DiscordMessageSnapshot[];
  member?: DiscordMember;
  sticker_items?: DiscordStickerItem[];
}

export interface DiscordChannel {
  id: string;
  type: number;
  guild_id?: string;
  position?: number;
  name?: string;
  topic?: string;
  nsfw?: boolean;
  last_message_id?: string;
  parent_id?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  features: string[];
}

const DISCORD_API_BASE = "https://discord.com/api/v10";

class DiscordAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "DiscordAPIError";
  }
}

async function makeDiscordRequest(endpoint: string) {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new DiscordAPIError("Discord bot token is not configured");
  }

  const response = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new DiscordAPIError(
      `Discord API request failed: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function getDiscordMessage(
  channelId: string,
  messageId: string
): Promise<DiscordMessage> {
  return makeDiscordRequest(`/channels/${channelId}/messages/${messageId}`);
}

export async function getDiscordChannel(
  channelId: string
): Promise<DiscordChannel> {
  return makeDiscordRequest(`/channels/${channelId}`);
}

export async function getDiscordGuild(guildId: string): Promise<DiscordGuild> {
  return makeDiscordRequest(`/guilds/${guildId}`);
}

export async function getGuildMember(
  guildId: string,
  userId: string
): Promise<DiscordMember> {
  return makeDiscordRequest(`/guilds/${guildId}/members/${userId}`);
}

export async function getGuildMembers(
  guildId: string,
  limit: number = 100
): Promise<DiscordMember[]> {
  return makeDiscordRequest(`/guilds/${guildId}/members?limit=${limit}`);
}

export async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
  return makeDiscordRequest(`/guilds/${guildId}/roles`);
}

export async function getGuildChannels(
  guildId: string
): Promise<DiscordChannel[]> {
  return makeDiscordRequest(`/guilds/${guildId}/channels`);
}

export function getDiscordAvatarUrl(
  user: DiscordUser,
  size: number = 256
): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
      user.avatar.startsWith("a_") ? "gif" : "png"
    }?size=${size}`;
  }
  // Default avatar
  const defaultAvatarNumber = parseInt(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
}

export function getGuildMemberAvatarUrl(
  member: DiscordMember,
  guildId: string,
  size: number = 256
): string {
  // If the member has a guild-specific avatar, use that
  if (member.avatar) {
    return `https://cdn.discordapp.com/guilds/${guildId}/users/${
      member.user.id
    }/avatars/${member.avatar}.${
      member.avatar.startsWith("a_") ? "gif" : "png"
    }?size=${size}`;
  }
  // Fall back to the user's global avatar
  return getDiscordAvatarUrl(member.user, size);
}

/**
 * Get the highest role color for a member
 */
export function getHighestRoleColor(
  member: DiscordMember,
  roles: DiscordRole[]
): string | null {
  if (!member.roles || member.roles.length === 0) return null;

  // Filter member's roles and find the one with the highest position and a color
  const memberRoles = roles
    .filter((role) => member.roles.includes(role.id) && role.color !== 0)
    .sort((a, b) => b.position - a.position); // Sort by position (highest first)

  if (memberRoles.length === 0) return null;

  const highestRole = memberRoles[0];
  return `#${highestRole.color.toString(16).padStart(6, "0")}`;
}
