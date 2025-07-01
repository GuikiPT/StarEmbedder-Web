import {
  DiscordAttachments,
  DiscordImageAttachment,
  DiscordFileAttachment,
  DiscordAudioAttachment,
  DiscordVideoAttachment,
} from "@skyra/discord-components-react";
import type {
  DiscordMessage,
  DiscordStickerFormatType,
} from "@/lib/discord-api";
import { getLargerDiscordImageUrl } from "@/lib/utils";

/**
 * Render Discord message attachments
 */
export function renderAttachments(attachments: DiscordMessage["attachments"]) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <DiscordAttachments slot="attachments" suppressHydrationWarning={true}>
      {attachments.map((attachment) => {
        const isImage = attachment.content_type?.startsWith("image/");
        const isAudio = attachment.content_type?.startsWith("audio/");
        const isVideo = attachment.content_type?.startsWith("video/");

        if (isImage) {
          // Use proxy_url if available, otherwise fallback to url
          const imageUrl = attachment.proxy_url || attachment.url;

          // Only apply size modifications if it's not a proxy URL with auth params
          const finalUrl = attachment.proxy_url
            ? imageUrl
            : getLargerDiscordImageUrl(imageUrl);

          return (
            <DiscordImageAttachment
              key={attachment.id}
              url={finalUrl!}
              alt={attachment.filename}
              suppressHydrationWarning={true}
            />
          );
        } else if (isAudio) {
          return (
            <DiscordAudioAttachment
              key={attachment.id}
              name={attachment.filename}
              href={attachment.proxy_url || attachment.url}
              bytes={attachment.size}
              suppressHydrationWarning={true}
            />
          );
        } else if (isVideo) {
          return (
            <DiscordVideoAttachment
              key={attachment.id}
              href={attachment.proxy_url || attachment.url}
              suppressHydrationWarning={true}
            />
          );
        } else {
          return (
            <DiscordFileAttachment
              key={attachment.id}
              name={attachment.filename}
              bytes={attachment.size}
              href={attachment.proxy_url || attachment.url}
              type={attachment.content_type}
              suppressHydrationWarning={true}
            />
          );
        }
      })}
    </DiscordAttachments>
  );
}

/**
 * Get the URL for a Discord sticker
 */
function getStickerUrl(
  stickerId: string,
  formatType: DiscordStickerFormatType
): string {
  const extension = formatType === 3 ? "json" : "png"; // Lottie stickers use json, others use png
  return `https://media.discordapp.net/stickers/${stickerId}.${extension}`;
}

/**
 * Render Discord message stickers as image attachments
 */
export function renderStickers(stickers: DiscordMessage["sticker_items"]) {
  if (!stickers || stickers.length === 0) return null;

  return (
    <DiscordAttachments slot="attachments" suppressHydrationWarning={true}>
      {stickers.map((sticker) => {
        // Only render as images for PNG, APNG, and GIF formats
        // Lottie stickers (format_type 3) would need special handling
        if (sticker.format_type === 3) {
          // For Lottie stickers, we could potentially render them differently
          // For now, we'll skip them or render as a placeholder
          return null;
        }

        const stickerUrl = getStickerUrl(sticker.id, sticker.format_type);

        return (
          <DiscordImageAttachment
            key={sticker.id}
            url={stickerUrl}
            alt={sticker.name}
            suppressHydrationWarning={true}
          />
        );
      })}
    </DiscordAttachments>
  );
}
