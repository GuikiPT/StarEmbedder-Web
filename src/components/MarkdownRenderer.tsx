import React from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import {
  DiscordImageAttachment,
  DiscordAttachments,
} from "@skyra/discord-components-react";
import { parseMarkdown, type MentionContext } from "../lib/markdown";
import { getDiscordProxyUrl } from "../lib/utils";
import type { DiscordMessage } from "../lib/discord-api";

interface CodeBlockInfo {
  id: string;
  language: string | null;
  content: string;
}

interface ImageInfo {
  id: string;
  url: string;
  alt: string;
}

/**
 * Find proxy URL for an image from embeds
 */
function findProxyUrlFromEmbeds(
  imageUrl: string,
  embeds?: DiscordMessage["embeds"]
): string {
  if (!embeds) return imageUrl;

  for (const embed of embeds) {
    // Check if the embed URL matches the image URL (most common case for content images)
    if (embed.url === imageUrl && embed.thumbnail?.proxy_url) {
      return embed.thumbnail.proxy_url;
    }

    // Check embed image
    if (embed.image?.url === imageUrl && embed.image.proxy_url) {
      return embed.image.proxy_url;
    }

    // Check embed thumbnail
    if (embed.thumbnail?.url === imageUrl && embed.thumbnail.proxy_url) {
      return embed.thumbnail.proxy_url;
    }

    // Check embed video (for GIFs)
    if (embed.video?.url === imageUrl && embed.video.proxy_url) {
      return embed.video.proxy_url;
    }

    // Also check if the URLs match after domain conversion
    const convertedImageUrl = getDiscordProxyUrl(imageUrl);
    if (
      embed.thumbnail?.url &&
      convertedImageUrl &&
      embed.thumbnail.url === convertedImageUrl &&
      embed.thumbnail.proxy_url
    ) {
      return embed.thumbnail.proxy_url;
    }
  }

  // If no proxy URL found in embeds, fallback to domain conversion
  return getDiscordProxyUrl(imageUrl) || imageUrl;
}

interface ParsedContent {
  htmlString: string;
  codeBlocks: CodeBlockInfo[];
  images: ImageInfo[];
}

/**
 * Parse markdown and extract code blocks for React rendering
 */
function parseMarkdownWithCodeBlocks(
  markdown: string,
  context?: MentionContext
): ParsedContent {
  if (!markdown) return { htmlString: "", codeBlocks: [], images: [] };

  const codeBlocks: CodeBlockInfo[] = [];
  let codeBlockCounter = 0;
  const lines = markdown.split("\n");
  const result: string[] = [];

  let isInCodeBlock = false;
  let codeBlockLines: string[] = [];
  let language: string | null = null;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (isInCodeBlock) {
        // End code block
        const codeContent = codeBlockLines.join("\n");
        const blockId = `codeblock-${codeBlockCounter++}`;

        codeBlocks.push({
          id: blockId,
          language: language || null,
          content: codeContent,
        });

        result.push(`<div data-codeblock-id="${blockId}"></div>`);
        result.push("<div></div>");

        codeBlockLines = [];
        language = null;
        isInCodeBlock = false;
      } else {
        // Start code block
        language = line.slice(3) || null;
        isInCodeBlock = true;
      }
      continue;
    }

    if (isInCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Process non-code-block content normally
    result.push(line);
  }

  // Process the non-code content through regular markdown parser
  const nonCodeContent = result.join("\n");
  const processedHtml = parseMarkdown(nonCodeContent, context);

  // Extract image placeholders
  const images: ImageInfo[] = [];
  let imageCounter = 0;
  const htmlWithImagePlaceholders = processedHtml.replace(
    /<div data-image-placeholder data-url="([^"]*)" data-alt="([^"]*)"><\/div>/g,
    (_, url, alt) => {
      const imageId = `image-${imageCounter++}`;
      images.push({ id: imageId, url, alt });
      return `<div data-image-id="${imageId}"></div>`;
    }
  );

  return {
    htmlString: htmlWithImagePlaceholders,
    codeBlocks,
    images,
  };
}

/**
 * Code block component
 */
function CodeBlock({
  language,
  content,
}: {
  language: string | null;
  content: string;
}) {
  const fallbackStyle = {
    padding: "12px",
    fontSize: 12,
    backgroundColor: "#2f3136",
    fontFamily:
      'ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace',
    borderRadius: "4px",
    border: "1px solid #40444b",
    overflow: "auto" as const,
    color: "#dcddde",
  };

  // Server-side rendering fallback
  if (typeof window === "undefined") {
    return (
      <div className="my-2">
        <pre style={fallbackStyle}>
          <code>{content}</code>
        </pre>
      </div>
    );
  }

  try {
    return (
      <div className="my-2">
        <CodeEditor
          value={content}
          language={language || "text"}
          placeholder=""
          readOnly
          style={{
            fontSize: 12,
            backgroundColor: "#2f3136",
            fontFamily:
              'ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace',
            borderRadius: "4px",
            border: "1px solid #40444b",
          }}
        />
      </div>
    );
  } catch (error) {
    console.warn("CodeEditor failed, using fallback:", error);
    return (
      <div className="my-2">
        <pre style={fallbackStyle}>
          <code>{content}</code>
        </pre>
      </div>
    );
  }
}

/**
 * Enhanced markdown renderer with React components for code blocks
 */
export function MarkdownRenderer({
  content,
  context,
  embeds,
}: {
  content: string;
  context?: MentionContext;
  embeds?: DiscordMessage["embeds"];
}) {
  const { htmlString, codeBlocks, images } = parseMarkdownWithCodeBlocks(
    content,
    context
  );

  // Simple HTML rendering if no code blocks or images
  if (codeBlocks.length === 0 && images.length === 0) {
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  }

  // Split HTML and insert React components
  const parts: (string | React.ReactElement)[] = [];
  let remainingHtml = htmlString;

  // Create a combined list of all placeholders with their positions
  const allPlaceholders: Array<{
    type: "code" | "image";
    placeholder: string;
    component: React.ReactElement;
    position: number;
  }> = [];

  // Add code block placeholders
  codeBlocks.forEach((codeBlock) => {
    const placeholder = `<div data-codeblock-id="${codeBlock.id}"></div>`;
    const position = remainingHtml.indexOf(placeholder);
    if (position !== -1) {
      allPlaceholders.push({
        type: "code",
        placeholder,
        component: (
          <CodeBlock
            key={codeBlock.id}
            language={codeBlock.language}
            content={codeBlock.content}
          />
        ),
        position,
      });
    }
  });

  // Add image placeholders
  images.forEach((image) => {
    const placeholder = `<div data-image-id="${image.id}"></div>`;
    const position = remainingHtml.indexOf(placeholder);
    if (position !== -1) {
      allPlaceholders.push({
        type: "image",
        placeholder,
        component: (
          <DiscordAttachments key={`images-${image.id}`}>
            <DiscordImageAttachment
              key={image.id}
              url={findProxyUrlFromEmbeds(image.url, embeds)}
              alt={image.alt}
            />
          </DiscordAttachments>
        ),
        position,
      });
    }
  });

  // Sort by position to maintain correct order
  allPlaceholders.sort((a, b) => a.position - b.position);

  // Process placeholders in order
  allPlaceholders.forEach((item) => {
    const placeholderIndex = remainingHtml.indexOf(item.placeholder);
    if (placeholderIndex !== -1) {
      const beforeHtml = remainingHtml.substring(0, placeholderIndex);
      if (beforeHtml.trim()) {
        parts.push(beforeHtml);
      }

      parts.push(item.component);

      remainingHtml = remainingHtml.substring(
        placeholderIndex + item.placeholder.length
      );
    }
  });

  if (remainingHtml.trim()) {
    parts.push(remainingHtml);
  }

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return (
            <span
              key={`html-${index}`}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        }
        return part;
      })}
    </>
  );
}
