import {
  DiscordEmbed,
  DiscordEmbedDescription,
  DiscordEmbedField,
  DiscordEmbedFields,
  DiscordEmbedFooter,
} from "@skyra/discord-components-react";
import { parseMarkdown, type MentionContext } from "@/lib/markdown";
import type { DiscordMessage } from "@/lib/discord-api";
import { getLargerDiscordImageUrl, isImageUrl } from "@/lib/utils";
import React from "react";

/**
 * Check if URL is likely a GIF embed
 */
function isGifEmbed(embed: DiscordMessage["embeds"][0]): boolean {
  return !!(
    embed.type === "gifv" ||
    embed.provider?.name?.toLowerCase().includes("tenor") ||
    embed.provider?.name?.toLowerCase().includes("giphy") ||
    embed.url?.includes("tenor.com") ||
    embed.url?.includes("giphy.com") ||
    (embed.video?.url &&
      (embed.video.url.includes(".gif") ||
        embed.video.url.includes("tenor") ||
        embed.video.url.includes("giphy")))
  );
}

/**
 * Normalize Discord attachment URLs for comparison by returning the path after
 * the `/attachments/` segment. This allows us to match attachments across the
 * `cdn.discordapp.com` and `media.discordapp.net` domains while ignoring query
 * parameters such as `ex`, `is`, and `hm` which are required for access.
 */
function getDiscordAttachmentPath(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname.includes("discordapp.com") || hostname.includes("discordapp.net")) {
      const idx = pathname.indexOf("/attachments/");
      if (idx !== -1) {
        return pathname.slice(idx);
      }
    }
  } catch {
    // ignore invalid URLs
  }
  return null;
}

/**
 * Render Discord embeds with proper spacing
 */
/**
 * Extract image URLs from message content that are displayed as attachments
 */
function extractImageUrlsFromContent(content: string): string[] {
  if (!content) return [];

  const imageUrls: string[] = [];

  const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  markdownLinks.forEach((match) => {
    const urlMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (urlMatch) {
      const url = urlMatch[2];
      if (isImageUrl(url)) {
        imageUrls.push(url);
      }
    }
  });

  const angleBracketLinks = content.match(/<(https?:\/\/[^\s>]+)>/g) || [];
  angleBracketLinks.forEach((match) => {
    const urlMatch = match.match(/<(https?:\/\/[^\s>]+)>/);
    if (urlMatch) {
      const url = urlMatch[1];
      if (isImageUrl(url)) {
        imageUrls.push(url);
      }
    }
  });

  const bareUrls =
    content.match(/(?<!href="|">)(https?:\/\/[^\s<]+)(?![^<]*<\/)/g) || [];
  bareUrls.forEach((url) => {
    if (isImageUrl(url)) {
      imageUrls.push(url);
    }
  });

  return imageUrls;
}

export function renderEmbeds(
  embeds: DiscordMessage["embeds"],
  mentionContext?: MentionContext,
  messageContent?: string
) {
  if (!embeds || embeds.length === 0) return null;
  const contentImageUrls = messageContent
    ? extractImageUrlsFromContent(messageContent)
    : [];

  const filteredEmbeds = embeds.filter((embed) => {
    if (embed.image?.url || embed.url) {
      const embedImageUrl = embed.image?.url;
      const embedUrl = embed.url;

      const matchesImageInContent = contentImageUrls.some((contentUrl) => {
        const contentBaseUrl = contentUrl.split("?")[0];
        const embedImageBaseUrl = embedImageUrl?.split("?")[0];
        const embedBaseUrl = embedUrl?.split("?")[0];

        const contentAttachmentPath = getDiscordAttachmentPath(contentUrl);
        const embedImagePath = embedImageUrl && getDiscordAttachmentPath(embedImageUrl);
        const embedPath = embedUrl && getDiscordAttachmentPath(embedUrl);

        const discordPathMatch =
          contentAttachmentPath &&
          ((embedImagePath && embedImagePath === contentAttachmentPath) ||
            (embedPath && embedPath === contentAttachmentPath));

        return (
          discordPathMatch ||
          embedImageUrl === contentUrl ||
          embedImageBaseUrl === contentBaseUrl ||
          embedUrl === contentUrl ||
          embedBaseUrl === contentBaseUrl
        );
      });

      if (matchesImageInContent) return false;
    }

    return true;
  });

  return filteredEmbeds.map((embed, index) => {
    // Handle GIF embeds differently
    if (isGifEmbed(embed)) {
      const previewUrl =
        embed.thumbnail?.proxy_url ||
        embed.thumbnail?.url ||
        embed.video?.proxy_url ||
        embed.image?.proxy_url ||
        embed.image?.url;

      if (previewUrl) {
        return (
          <React.Fragment key={index}>
            <div className="gif-embed my-4">
              <DiscordEmbed
                slot="embeds"
                color={
                  embed.color
                    ? `#${embed.color.toString(16).padStart(6, "0")}`
                    : undefined
                }
                embedTitle={embed.title}
                url={embed.url}
                authorName={embed.author?.name}
                authorUrl={embed.author?.url}
                authorImage={getLargerDiscordImageUrl(embed.author?.icon_url)}
                image={getLargerDiscordImageUrl(previewUrl)}
              >
                {embed.description && (
                  <DiscordEmbedDescription slot="description">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(
                          embed.description,
                          mentionContext
                        ),
                      }}
                    />
                  </DiscordEmbedDescription>
                )}
              </DiscordEmbed>
            </div>
            {index < embeds.length - 1 && <br />}
          </React.Fragment>
        );
      }
    }

    // Regular embed
    return (
      <React.Fragment key={index}>
        <DiscordEmbed
          slot="embeds"
          color={
            embed.color
              ? `#${embed.color.toString(16).padStart(6, "0")}`
              : undefined
          }
          embedTitle={embed.title}
          url={embed.url}
          authorName={embed.author?.name}
          authorUrl={embed.author?.url}
          authorImage={getLargerDiscordImageUrl(
            embed.author?.icon_url
          )}
          image={getLargerDiscordImageUrl(
            embed.image?.proxy_url || embed.image?.url
          )}
          thumbnail={getLargerDiscordImageUrl(
            embed.thumbnail?.proxy_url || embed.thumbnail?.url
          )}
        >
          {embed.description && (
            <DiscordEmbedDescription slot="description">
              <div
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(embed.description, mentionContext),
                }}
              />
            </DiscordEmbedDescription>
          )}

          {embed.fields && embed.fields.length > 0 && (
            <DiscordEmbedFields slot="fields">
              {embed.fields.map((field, fieldIndex) => {
                // Calculate inline-index for consecutive inline fields
                let inlineIndex = undefined;
                if (field.inline) {
                  const inlineFieldsBefore = embed
                    .fields!.slice(0, fieldIndex)
                    .filter((f) => f.inline);
                  inlineIndex = inlineFieldsBefore.length + 1;
                }

                return (
                  <DiscordEmbedField
                    key={fieldIndex}
                    fieldTitle={field.name}
                    inline={field.inline ? true : undefined}
                    inline-index={inlineIndex?.toString()}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(field.value, mentionContext),
                      }}
                    />
                  </DiscordEmbedField>
                );
              })}
            </DiscordEmbedFields>
          )}

          {embed.footer && (
            <DiscordEmbedFooter
              slot="footer"
              footerImage={embed.footer.icon_url}
              timestamp={
                embed.timestamp ? new Date(embed.timestamp) : undefined
              }
            >
              {embed.footer.text}
            </DiscordEmbedFooter>
          )}
        </DiscordEmbed>
        {index < embeds.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
