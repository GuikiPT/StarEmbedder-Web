import type { DiscordUser, DiscordMember, DiscordRole, DiscordChannel } from './discord-api';
import { isImageUrl } from './utils';

export interface MentionContext {
  guildMembers: DiscordMember[];
  guildRoles: DiscordRole[];
  guildChannels: DiscordChannel[];
}

/**
 * Get display name for a user
 */
export function getDisplayName(user: DiscordUser, member?: DiscordMember): string {
  if (!user) return "Unknown User";
  return member?.nick || user.global_name || user.username || "Unknown User";
}

/**
 * Convert Discord snowflake timestamp to Date
 */
export function snowflakeToDate(snowflake: string): Date {
  const timestamp = (BigInt(snowflake) >> BigInt(22)) + BigInt(1420070400000);
  return new Date(Number(timestamp));
}

/**
 * Format Discord timestamp
 */
export function formatDiscordTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format Discord timestamp with format type
 */
export function formatDiscordTimestampWithType(timestamp: string, formatType: string): string {
  const date = new Date(Number(timestamp) * 1000); // Discord timestamps are in seconds
  
  switch (formatType.toLowerCase()) {
    case 't': // Short time (e.g., 16:20)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 't': // Short time (e.g., 16:20)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'T': // Long time (e.g., 16:20:30)
      return date.toLocaleTimeString();
    case 'd': // Short date (e.g., 20/04/2021)
      return date.toLocaleDateString();
    case 'D': // Long date (e.g., 20 April 2021)
      return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    case 'f': // Short date/time (e.g., 20 April 2021 16:20)
      return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'F': // Long date/time (e.g., Tuesday, 20 April 2021 16:20)
      return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'R': // Relative time (e.g., 2 months ago)
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);

      if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
      if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    default:
      return date.toLocaleString();
  }
}

/**
 * Resolve mention functions
 */
function resolveUserMention(userId: string, context: MentionContext): string {
  const member = context.guildMembers.find(m => m.user.id === userId);
  return member ? getDisplayName(member.user, member) : 'Unknown User';
}

function resolveRoleMention(roleId: string, context: MentionContext): string {
  const role = context.guildRoles.find(r => r.id === roleId);
  return role ? role.name : 'Unknown Role';
}

function resolveChannelMention(channelId: string, context: MentionContext): string {
  const channel = context.guildChannels.find(c => c.id === channelId);
  return channel ? (channel.name || 'Unknown Channel') : 'Unknown Channel';
}

/**
 * Check if content should use jumbo emojis
 */
function shouldUseJumboEmojis(content: string): boolean {
  if (!content?.trim()) return false;
  
  const emojiMatches = content.match(/<a?:[^:]+:\d{18,21}>/g) || [];
  const contentWithoutCustomEmojis = content.replace(/<a?:[^:]+:\d{18,21}>/g, '');
  
  const unicodeEmojiMatches = contentWithoutCustomEmojis.match(
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  ) || [];
  
  const totalEmojis = emojiMatches.length + unicodeEmojiMatches.length;
  const textWithoutEmojis = contentWithoutCustomEmojis
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, '')
    .trim();
  
  return totalEmojis >= 1 && totalEmojis <= 30 && textWithoutEmojis === '';
}


/**
 * Process markdown content
 */
function processMarkdownContent(markdown: string, context?: MentionContext, renderImages: boolean = true): string {
  let processed = markdown
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      if (isImageUrl(url) && renderImages) {
        return `<div data-image-placeholder data-url="${url}" data-alt="${text}"></div>`;
      }
      return `<discord-link href="${url}" target="_blank" rel="noreferrer">${text}</discord-link>`;
    })
    .replace(/<(https?:\/\/[^\s>]+)>/g, (match, url) => {
      if (isImageUrl(url) && renderImages) {
        return `<div data-image-placeholder data-url="${url}" data-alt="Image"></div>`;
      }
      return `<discord-link href="${url}" target="_blank" rel="noreferrer">${url}</discord-link>`;
    })
    .replace(/(?<!href="|">|data-url=")(https?:\/\/[^\s<]+)(?![^<]*<\/discord-link>|"[^>]*>)/g, (match, url) => {
      if (isImageUrl(url) && renderImages) {
        return `<div data-image-placeholder data-url="${url}" data-alt="Image"></div>`;
      }
      return `<discord-link href="${url}" target="_blank" rel="noreferrer">${url}</discord-link>`;
    })
    .replaceAll('_ _', '<br/>');

  // Process mentions
  if (context) {
    processed = processed
      .replace(/<@(\d{18,21})>/g, (_, userId) => {
        const resolvedName = resolveUserMention(userId, context);
        return `<discord-mention type="user">${resolvedName}</discord-mention>`;
      })
      .replace(/<@&(\d{18,21})>/g, (_, roleId) => {
        const resolvedName = resolveRoleMention(roleId, context);
        return `<discord-mention type="role">${resolvedName}</discord-mention>`;
      })
      .replace(/<#(\d{18,21})>/g, (_, channelId) => {
        const resolvedName = resolveChannelMention(channelId, context);
        return `<discord-mention type="channel">${resolvedName}</discord-mention>`;
      });
  } else {
    processed = processed
      .replace(/<@(\d{18,21})>/g, '<discord-mention type="user">$1</discord-mention>')
      .replace(/<@&(\d{18,21})>/g, '<discord-mention type="role">$1</discord-mention>')
      .replace(/<#(\d{18,21})>/g, '<discord-mention type="channel">$1</discord-mention>');
  }

  return processed;
}

/**
 * Apply markdown formatting to a line
 */
function formatMarkdownLine(line: string): string {
  return line
    .replaceAll(/^(-#) (.+)$/g, '<discord-subscript>$2</discord-subscript>')
    .replaceAll(/(#{1,3}) (.+)/g, (_, hashes, text) => 
      `<discord-header level="${hashes.length}">${text}</discord-header>`)
    .replaceAll(/^(>{1,3}) (.+)$/g, '<discord-quote>$2</discord-quote>')
    .replaceAll(/(\*\*)(.+?)\1/g, '<discord-bold>$2</discord-bold>')
    .replaceAll(/(\*)(.+?)\1/g, '<discord-italic>$2</discord-italic>')
    .replaceAll(/(__)(.+?)\1/g, '<discord-underlined>$2</discord-underlined>')
    .replaceAll(/(\|\|)(.+?)\1/g, '<discord-spoiler>$2</discord-spoiler>')
    .replaceAll(/(`{1,2})(.+?)\1/g, '<discord-code>$2</discord-code>')
    .replaceAll(/\[([^\]]+)\]\(<([^>]+)>\)/g, (match, text, url) => {
      if (isImageUrl(url)) {
        return `<div data-image-placeholder data-url="${url}" data-alt="${text}"></div>`;
      }
      return `<discord-link href="${url}" target="_blank" rel="noreferrer">${text}</discord-link>`;
    })
    .replaceAll(/<t:(\d+):([tTdDfFR])>/g, (match, timestamp, formatType) => {
      const formattedTime = formatDiscordTimestampWithType(timestamp, formatType);
      return `<discord-time title="${formattedTime}">${formattedTime}</discord-time>`;
    })
    .replaceAll(/<\/(\w+):\d{18,21}>/g, '<discord-mention type="slash">$1</discord-mention>')
    .replaceAll(/^- (.+)$/g, '<discord-list-item>$1</discord-list-item>');
}

/**
 * Format quote lines, wrapping list items in proper list tags
 */
function formatQuoteLines(quoteLines: string[]): string {
  if (quoteLines.length === 0) return '';
  
  // Check if all lines are list items
  const allAreListItems = quoteLines.every(line => line.startsWith('<li>'));
  
  if (allAreListItems) {
    // Wrap all list items in a <ul> tag
    return `<ul style="margin: 0; padding-left: 16px; list-style: none;">${quoteLines.join('')}</ul>`;
  } else {
    // Regular quote formatting
    return quoteLines.join('<br>');
  }
}

/**
 * Main markdown parser
 */
export function parseMarkdown(markdown: string, context?: MentionContext, renderImages: boolean = true): string {
  if (!markdown) return '';

  const isJumbo = shouldUseJumboEmojis(markdown);
  const processed = processMarkdownContent(markdown, context, renderImages);
  const lines = processed.split('\n');
  const result: string[] = [];

  let isInCodeBlock = false;
  let codeBlockLines: string[] = [];
  let language: string | null = null;
  let isInQuoteBlock = false;
  let isInTripleQuoteBlock = false;
  let quoteLines: string[] = [];
  let isInListBlock = false;
  let listItems: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('```')) {
      // Handle quote and list blocks before code blocks
      if (isInQuoteBlock) {
        result.push(`<discord-quote>${formatQuoteLines(quoteLines)}</discord-quote>`);
        quoteLines = [];
        isInQuoteBlock = false;
        isInTripleQuoteBlock = false;
      }
      if (isInListBlock) {
        result.push(`<discord-unordered-list>${listItems.join('')}</discord-unordered-list>`);
        listItems = [];
        isInListBlock = false;
      }

      if (isInCodeBlock) {
        // End code block
        const codeContent = codeBlockLines.join('\n');
        const languageAttr = language ? ` language="${language}"` : '';
        result.push(`<discord-code multiline${languageAttr}>${codeContent}</discord-code>`);
        
        codeBlockLines = [];
        language = null;
        isInCodeBlock = false;
      } else {
        // Start code block
        language = line.slice(3) || null;
        isInCodeBlock = true;
      }
    } else if (isInCodeBlock) {
      codeBlockLines.push(line);
    } else if (line.match(/^>>> /)) {
      // Handle triple quote start - all subsequent lines are part of the quote until end of content
      if (isInListBlock) {
        result.push(`<discord-unordered-list>${listItems.join('')}</discord-unordered-list>`);
        listItems = [];
        isInListBlock = false;
      }
      if (!isInQuoteBlock) {
        isInQuoteBlock = true;
        isInTripleQuoteBlock = true;
      }
      const quoteContent = line.replace(/^>>> /, '');
      
      // Check if this quote line is actually a list item (handles both `- ` and - patterns)
      if (quoteContent.match(/^(`-`|-)( |$)/)) {
        // Handle quoted list items specially - wrap in list item tags
        const listContent = quoteContent.replace(/^(`-`|-)( |$)/, '');
        const formattedListContent = listContent
          .replaceAll(/(\*\*)(.+?)\1/g, '<discord-bold>$2</discord-bold>')
          .replaceAll(/(\*)(.+?)\1/g, '<discord-italic>$2</discord-italic>')
          .replaceAll(/(__)(.+?)\1/g, '<discord-underlined>$2</discord-underlined>')
          .replaceAll(/(\|\|)(.+?)\1/g, '<discord-spoiler>$2</discord-spoiler>')
          .replaceAll(/(`{1,2})(.+?)\1/g, '<discord-code>$2</discord-code>');
        quoteLines.push(`<li><discord-code>-</discord-code> ${formattedListContent}</li>`);
      } else {
        // Apply formatting to quote content but avoid nested quotes
        const formattedQuoteContent = quoteContent
          .replaceAll(/(\*\*)(.+?)\1/g, '<discord-bold>$2</discord-bold>')
          .replaceAll(/(\*)(.+?)\1/g, '<discord-italic>$2</discord-italic>')
          .replaceAll(/(__)(.+?)\1/g, '<discord-underlined>$2</discord-underlined>')
          .replaceAll(/(\|\|)(.+?)\1/g, '<discord-spoiler>$2</discord-spoiler>')
          .replaceAll(/(`{1,2})(.+?)\1/g, '<discord-code>$2</discord-code>')
          .replaceAll(/<t:(\d+):([tTdDfFR])>/g, (match, timestamp, formatType) => {
            const formattedTime = formatDiscordTimestampWithType(timestamp, formatType);
            return `<discord-time title="${formattedTime}">${formattedTime}</discord-time>`;
          });
        quoteLines.push(formattedQuoteContent);
      }
    } else if (line.match(/^>{1,2} /) || (isInTripleQuoteBlock && !line.match(/^```/) && line.trim() !== '')) {
      // Handle single/double quote lines OR continuation of triple quote block
      if (isInListBlock) {
        result.push(`<discord-unordered-list>${listItems.join('')}</discord-unordered-list>`);
        listItems = [];
        isInListBlock = false;
      }
      if (!isInQuoteBlock) {
        isInQuoteBlock = true;
      }
      
      let quoteContent: string;
      if (isInTripleQuoteBlock) {
        // For triple quote continuation, the entire line is part of the quote
        quoteContent = line;
      } else {
        // For regular quotes, remove the quote prefix
        quoteContent = line.replace(/^>{1,2} /, '');
      }
      
      // Check if this quote line is actually a list item (handles both `- ` and - patterns)
      if (quoteContent.match(/^(`-`|-)( |$)/)) {
        // Handle quoted list items specially - wrap in list item tags
        const listContent = quoteContent.replace(/^(`-`|-)( |$)/, '');
        const formattedListContent = listContent
          .replaceAll(/(\*\*)(.+?)\1/g, '<discord-bold>$2</discord-bold>')
          .replaceAll(/(\*)(.+?)\1/g, '<discord-italic>$2</discord-italic>')
          .replaceAll(/(__)(.+?)\1/g, '<discord-underlined>$2</discord-underlined>')
          .replaceAll(/(\|\|)(.+?)\1/g, '<discord-spoiler>$2</discord-spoiler>')
          .replaceAll(/(`{1,2})(.+?)\1/g, '<discord-code>$2</discord-code>');
        quoteLines.push(`<li><discord-code>-</discord-code> ${formattedListContent}</li>`);
      } else {
        // Apply formatting to quote content but avoid nested quotes
        const formattedQuoteContent = quoteContent
          .replaceAll(/(\*\*)(.+?)\1/g, '<discord-bold>$2</discord-bold>')
          .replaceAll(/(\*)(.+?)\1/g, '<discord-italic>$2</discord-italic>')
          .replaceAll(/(__)(.+?)\1/g, '<discord-underlined>$2</discord-underlined>')
          .replaceAll(/(\|\|)(.+?)\1/g, '<discord-spoiler>$2</discord-spoiler>')
          .replaceAll(/(`{1,2})(.+?)\1/g, '<discord-code>$2</discord-code>')
          .replaceAll(/<t:(\d+):([tTdDfFR])>/g, (match, timestamp, formatType) => {
            const formattedTime = formatDiscordTimestampWithType(timestamp, formatType);
            return `<discord-time title="${formattedTime}">${formattedTime}</discord-time>`;
          });
        quoteLines.push(formattedQuoteContent);
      }
    } else if (line.match(/^- /)) {
      // Handle list items
      if (isInQuoteBlock) {
        result.push(`<discord-quote>${formatQuoteLines(quoteLines)}</discord-quote>`);
        quoteLines = [];
        isInQuoteBlock = false;
        isInTripleQuoteBlock = false;
      }
      if (!isInListBlock) {
        isInListBlock = true;
      }
      const listContent = line.replace(/^- /, '');
      // Apply formatting to list content
      const formattedListContent = listContent
        .replaceAll(/(\*\*)(.+?)\1/g, '<discord-bold>$2</discord-bold>')
        .replaceAll(/(\*)(.+?)\1/g, '<discord-italic>$2</discord-italic>')
        .replaceAll(/(__)(.+?)\1/g, '<discord-underlined>$2</discord-underlined>')
        .replaceAll(/(\|\|)(.+?)\1/g, '<discord-spoiler>$2</discord-spoiler>')
        .replaceAll(/(`{1,2})(.+?)\1/g, '<discord-code>$2</discord-code>');
      listItems.push(`<discord-list-item>${formattedListContent}</discord-list-item>`);
    } else {
      // Not a quote or list line, finish any pending blocks
      if (isInQuoteBlock) {
        result.push(`<discord-quote>${formatQuoteLines(quoteLines)}</discord-quote>`);
        quoteLines = [];
        isInQuoteBlock = false;
        isInTripleQuoteBlock = false;
      }
      if (isInListBlock) {
        result.push(`<discord-unordered-list>${listItems.join('')}</discord-unordered-list>`);
        listItems = [];
        isInListBlock = false;
      }
      
      // Process regular line
      if (line.trim() === '') {
        // Empty line - add paragraph break if not already at the end
        if (result.length > 0 && !result[result.length - 1].endsWith('<br><br>')) {
          result.push('<br><br>');
        }
      } else {
        const formattedLine = formatMarkdownLine(line);
        result.push(formattedLine);
        
        // Add single line break if the next line exists and is not empty and not a quote or list
        if (i < lines.length - 1) {
          const nextLine = lines[i + 1];
          if (nextLine.trim() !== '' && !nextLine.match(/^>{1,3} /) && !nextLine.match(/^- /)) {
            result.push('<br>');
          }
        }
      }
    }
  }

  // Handle any remaining blocks
  if (isInQuoteBlock && quoteLines.length > 0) {
    result.push(`<discord-quote>${formatQuoteLines(quoteLines)}</discord-quote>`);
  }
  if (isInListBlock && listItems.length > 0) {
    result.push(`<discord-unordered-list>${listItems.join('')}</discord-unordered-list>`);
  }

  let finalResult = result.join('');

  // Process Discord emojis
  const jumboAttr = isJumbo ? ' jumbo' : '';
  finalResult = finalResult
    .replace(/<a:([^:]+):(\d{18,21})>/g, `<discord-custom-emoji name="$1" url="https://cdn.discordapp.com/emojis/$2.gif"${jumboAttr}></discord-custom-emoji>`)
    .replace(/<:([^:]+):(\d{18,21})>/g, `<discord-custom-emoji name="$1" url="https://cdn.discordapp.com/emojis/$2.png"${jumboAttr}></discord-custom-emoji>`);

  return finalResult;
}
