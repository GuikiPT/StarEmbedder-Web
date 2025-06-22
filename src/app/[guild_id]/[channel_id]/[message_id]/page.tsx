import { notFound } from "next/navigation";
import React from "react";
import {
  DiscordMessage as DiscordMessageComponent,
  DiscordMessages,
  DiscordReply,
} from "@skyra/discord-components-react";
import {
  getDiscordMessage,
  getDiscordChannel,
  getDiscordGuild,
  getGuildMember,
  getGuildMembers,
  getGuildRoles,
  getGuildChannels,
  getDiscordAvatarUrl,
  getGuildMemberAvatarUrl,
  getHighestRoleColor,
  type DiscordMessage,
} from "@/lib/discord-api";
import {
  formatDiscordTimestamp,
  getDisplayName,
  parseMarkdown,
  type MentionContext,
} from "@/lib/markdown";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { isValidDiscordId, isForwardedMessage } from "@/lib/utils";
import { renderEmbeds } from "@/lib/messageRenderers";
import { renderAttachments, renderStickers } from "@/lib/attachmentRenderers";

interface PageProps {
  params: Promise<{
    guild_id: string;
    channel_id: string;
    message_id: string;
  }>;
}

async function getMessageData(
  guildId: string,
  channelId: string,
  messageId: string
) {
  try {
    const [message, channel, guild, guildMembers, guildRoles, guildChannels] =
      await Promise.all([
        getDiscordMessage(channelId, messageId),
        getDiscordChannel(channelId),
        getDiscordGuild(guildId),
        getGuildMembers(guildId, 100), // Fetch first 100 members for mention resolution
        getGuildRoles(guildId),
        getGuildChannels(guildId),
      ]);

    // If the message author is not in the initial member list, fetch them specifically
    let authorMember = guildMembers.find(
      (m) => m.user.id === message.author.id
    );
    if (!authorMember) {
      try {
        authorMember = await getGuildMember(guildId, message.author.id);
      } catch (error) {
        console.warn(
          `Could not fetch guild member for author ${message.author.id}:`,
          error
        );
      }
    }

    // Create mention context for resolving mentions
    const mentionContext: MentionContext = {
      guildMembers,
      guildRoles,
      guildChannels,
    };

    return { message, channel, guild, authorMember, mentionContext };
  } catch (error) {
    console.error("Error fetching Discord data:", error);
    return null;
  }
}

function renderMessageContent(
  content: string,
  mentionContext?: MentionContext,
  embeds?: DiscordMessage["embeds"]
) {
  if (!content) return null;

  return (
    <MarkdownRenderer
      content={content}
      context={mentionContext}
      embeds={embeds}
    />
  );
}

/**
 * Extract image URLs from message content that are being shown as attachments
 */

function truncateReplyText(text: string, maxLength: number = 150): string {
  if (!text || text.trim() === "") return "Click to see attachment";

  // First, let's do a basic cleanup without removing mentions/emojis for parsing
  const basicCleanText = text
    .replace(/```[\s\S]*?```/g, "[code]") // Code blocks
    .replace(/\n+/g, " ") // Replace all newlines with single spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();

  if (basicCleanText.length <= maxLength) return basicCleanText;

  // Find the last word boundary before the limit to avoid cutting words
  const truncated = basicCleanText.substring(0, maxLength - 3); // Reserve space for "..."
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > (maxLength - 3) * 0.7) {
    // If we find a space reasonably close to the limit
    return basicCleanText.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

function renderReplyContent(
  content: string,
  mentionContext?: MentionContext,
  maxLength: number = 100
): React.ReactElement {
  if (!content || content.trim() === "") {
    return <span>Click to see attachment</span>;
  }

  // Truncate first, then parse the truncated content
  const truncatedContent = truncateReplyText(content, maxLength);

  // Parse the truncated content with full markdown, mentions, and emojis
  const parsedContent = parseMarkdown(truncatedContent, mentionContext);

  return <span dangerouslySetInnerHTML={{ __html: parsedContent }} />;
}

function renderFullReplyMessage(
  replyMessage: DiscordMessage,
  mentionContext?: MentionContext
): React.ReactElement {
  // Find the guild member data for the replied message author
  const replyAuthorMember =
    mentionContext?.guildMembers.find(
      (m) => m.user.id === replyMessage.author.id
    ) || replyMessage.member;

  // Get display name and avatar for the replied message author
  const replyAuthorName = getDisplayName(
    replyMessage.author,
    replyAuthorMember
  );
  const replyAvatarUrl = getDiscordAvatarUrl(replyMessage.author, 512);

  // Get role color for the replied message author if they are a guild member
  const replyAuthorRoleColor = replyAuthorMember
    ? getHighestRoleColor(replyAuthorMember, mentionContext?.guildRoles || [])
    : null;

  return (
    <DiscordMessages className="ml-4 mb-4 mt-4 mr-4 opacity-80">
      <DiscordMessageComponent
        author={replyAuthorName}
        avatar={replyAvatarUrl}
        roleColor={replyAuthorRoleColor || undefined}
        timestamp={formatDiscordTimestamp(replyMessage.timestamp)}
        edited={!!replyMessage.edited_timestamp}
      >
        {/* Forwarded Messages (Snapshots) in Reply */}
        {isForwardedMessage(replyMessage) && replyMessage.message_snapshots && (
          <div className="forwarded-messages mb-4">
            {replyMessage.message_snapshots.map((snapshot, index) => (
              <div key={index}>
                {renderForwardedMessage(snapshot.message, mentionContext)}
              </div>
            ))}
          </div>
        )}

        {/* Reply Message Content */}
        {renderMessageContent(
          replyMessage.content,
          mentionContext,
          replyMessage.embeds
        )}

        {/* Reply Message Embeds */}
        {renderEmbeds(
          replyMessage.embeds,
          mentionContext,
          replyMessage.content
        )}

        {/* Reply Message Attachments */}
        {renderAttachments(replyMessage.attachments)}
        {renderStickers(replyMessage.sticker_items)}
      </DiscordMessageComponent>
    </DiscordMessages>
  );
}

function renderForwardedMessage(
  snapshot: DiscordMessage,
  mentionContext?: MentionContext
): React.ReactElement {
  return (
    <div className="forwarded-message border-l-4 border-blue-500 pl-4 mb-4 bg-gray-700 rounded-r-lg p-3">
      {/* Forwarded message header */}
      <div className="flex items-center mb-2">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 717 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <span className="text-sm text-blue-300 font-medium">
          Forwarded Message
        </span>
        {snapshot.timestamp && (
          <span className="text-xs text-gray-500 ml-2">
            {formatDiscordTimestamp(snapshot.timestamp)}
          </span>
        )}
      </div>

      {/* Forwarded Message Content */}
      {snapshot.content && (
        <div className="text-gray-200">
          {renderMessageContent(
            snapshot.content,
            mentionContext,
            snapshot.embeds
          )}
        </div>
      )}

      {/* Forwarded Message Embeds */}
      {snapshot.embeds && snapshot.embeds.length > 0 && (
        <div className="mt-2">
          {renderEmbeds(snapshot.embeds, mentionContext, snapshot.content)}
        </div>
      )}

      {/* Forwarded Message Attachments */}
      {snapshot.attachments && snapshot.attachments.length > 0 && (
        <div className="mt-2">{renderAttachments(snapshot.attachments)}</div>
      )}
      {snapshot.sticker_items && snapshot.sticker_items.length > 0 && (
        <div className="mt-2">{renderStickers(snapshot.sticker_items)}</div>
      )}
    </div>
  );
}

export default async function DiscordMessagePage({ params }: PageProps) {
  // Await the params object first
  const resolvedParams = await params;

  // Validate Discord IDs first
  if (
    !isValidDiscordId(resolvedParams.guild_id) ||
    !isValidDiscordId(resolvedParams.channel_id) ||
    !isValidDiscordId(resolvedParams.message_id)
  ) {
    notFound();
  }

  const data = await getMessageData(
    resolvedParams.guild_id,
    resolvedParams.channel_id,
    resolvedParams.message_id
  );

  if (!data) {
    notFound();
  }

  const { message, guild, authorMember, mentionContext } = data;

  // Use guild member data for the author if available
  const authorName = authorMember
    ? getDisplayName(message.author, authorMember)
    : getDisplayName(message.author, message.member);

  // Use guild-specific avatar if available, otherwise fall back to global avatar
  const avatarUrl = authorMember
    ? getGuildMemberAvatarUrl(authorMember, guild.id, 512)
    : getDiscordAvatarUrl(message.author, 512);

  // Get the highest role color for the author
  const authorRoleColor = authorMember
    ? getHighestRoleColor(authorMember, mentionContext.guildRoles)
    : null;

  return (
    <div
      className="p-4 max-w-3xl rounded-lg shadow-lg"
      style={{ backgroundColor: "#36393e" }}
      id="discord-message-container"
    >
      {/* Show full replied message above the main message */}
      {message.referenced_message && (
        <div className="mb-6">
          {renderFullReplyMessage(message.referenced_message, mentionContext)}
        </div>
      )}

      <DiscordMessages className="pl-4">
        <DiscordMessageComponent
          author={authorName}
          avatar={avatarUrl}
          roleColor={authorRoleColor || undefined}
          timestamp={formatDiscordTimestamp(message.timestamp)}
          edited={!!message.edited_timestamp}
        >
          {/* Standard Discord Reply indicator for consistency */}
          {message.referenced_message && (
            <DiscordReply
              slot="reply"
              author={getDisplayName(
                message.referenced_message.author,
                message.referenced_message.member
              )}
              avatar={getDiscordAvatarUrl(
                message.referenced_message.author,
                512
              )}
              style={{ left: "55px" }}
            >
              {renderReplyContent(
                message.referenced_message.content,
                mentionContext
              )}
            </DiscordReply>
          )}

          {/* Forwarded Messages (Snapshots) */}
          {isForwardedMessage(message) && message.message_snapshots && (
            <div className="forwarded-messages mb-4">
              <div className="text-xs text-gray-400 mb-2 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Forwarded message
              </div>
              {message.message_snapshots.map((snapshot, index) => (
                <div key={index}>
                  {renderForwardedMessage(snapshot.message, mentionContext)}
                </div>
              ))}
            </div>
          )}

          {/* Message Content */}
          {renderMessageContent(
            message.content,
            mentionContext,
            message.embeds
          )}

          {/* Embeds */}
          {renderEmbeds(message.embeds, mentionContext, message.content)}

          {/* Attachments */}
          {renderAttachments(message.attachments)}

          {/* Stickers */}
          {renderStickers(message.sticker_items)}
        </DiscordMessageComponent>
      </DiscordMessages>
    </div>
  );
}
