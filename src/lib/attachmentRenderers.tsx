import {
  DiscordAttachments,
  DiscordImageAttachment,
  DiscordFileAttachment,
  DiscordAudioAttachment,
  DiscordVideoAttachment,
} from "@skyra/discord-components-react";
import type { DiscordMessage } from "@/lib/discord-api";
import { getLargerDiscordImageUrl } from "@/lib/utils";

/**
 * Render Discord message attachments
 */
export function renderAttachments(attachments: DiscordMessage["attachments"]) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <DiscordAttachments slot="attachments">
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
            />
          );
        } else if (isAudio) {
          return (
            <DiscordAudioAttachment
              key={attachment.id}
              name={attachment.filename}
              href={attachment.proxy_url || attachment.url}
              bytes={attachment.size}
            />
          );
        } else if (isVideo) {
          return (
            <DiscordVideoAttachment
              key={attachment.id}
              href={attachment.proxy_url || attachment.url}
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
            />
          );
        }
      })}
    </DiscordAttachments>
  );
}
