/**
 * Injector Module - Format LATEST.md as context preamble
 *
 * Converts stored session data into clean, formatted context that can be
 * injected into AI chats for continuity across sessions.
 */

import type { Session, SessionSummary, ContextFile } from 'contextcarry-types';

/**
 * Format options for preamble generation
 */
export interface FormatOptions {
  maxTokens?: number;
  includeTimestamp?: boolean;
  includeKeywords?: boolean;
  includeFilePaths?: boolean;
  format?: 'markdown' | 'plain' | 'json';
}

/**
 * Format a session as a context preamble
 * The preamble provides structured context that helps AI models understand
 * previous work, decisions, and next steps
 */
export function formatPreamble(
  session: Session,
  options: FormatOptions = {}
): string {
  const {
    maxTokens,
    includeTimestamp = true,
    includeKeywords = true,
    includeFilePaths = true,
    format = 'markdown'
  } = options;

  // Format based on requested output format
  if (format === 'json') {
    return formatAsJson(session, options);
  }

  if (format === 'plain') {
    return formatAsPlainText(session, options);
  }

  // Default to markdown format
  let preamble = '';

  // Header with project info
  preamble += `# Context Carry: ${session.projectName}`;
  if (session.branch) {
    preamble += ` (${session.branch})`;
  }
  preamble += '\n\n';

  // Timestamp if included
  if (includeTimestamp) {
    const date = new Date(session.timestamp);
    preamble += `**Session Date:** ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n\n`;
  }

  // Summary section
  if (session.summary) {
    preamble += `## Summary\n${session.summary}\n\n`;
  }

  // Keywords if included
  if (includeKeywords && session.keywords?.length > 0) {
    preamble += `## Keywords\n${session.keywords.join(', ')}\n\n`;
  }

  // Files worked on if included
  if (includeFilePaths && session.filePaths?.length > 0) {
    preamble += `## Files Worked On\n`;
    session.filePaths.forEach(file => {
      preamble += `- ${file}\n`;
    });
    preamble += '\n';
  }

  // Metadata if available
  if (session.metadata) {
    const metadataSections: string[] = [];

    if (session.metadata.durationMs) {
      const duration = Math.round(session.metadata.durationMs / 1000 / 60);
      metadataSections.push(`Duration: ${duration} minutes`);
    }

    if (session.metadata.toolsUsed && session.metadata.toolsUsed.length > 0) {
      metadataSections.push(`Tools: ${session.metadata.toolsUsed.join(', ')}`);
    }

    if (session.metadata.lastCommand) {
      metadataSections.push(`Last Command: ${session.metadata.lastCommand}`);
    }

    if (metadataSections.length > 0) {
      preamble += `## Session Metadata\n${metadataSections.join('\n')}\n\n`;
    }
  }

  // Token compression info
  if (session.tokensCompressed > 0) {
    preamble += `> This session was compressed from ${session.tokensCompressed} tokens to this summary.\n`;
  }

  // Apply token limit if specified
  if (maxTokens) {
    preamble = truncateToTokenLimit(preamble, maxTokens);
  }

  return preamble;
}

/**
 * Format as structured JSON
 */
function formatAsJson(session: Session, options: FormatOptions): string {
  const { includeTimestamp, includeKeywords, includeFilePaths } = options;

  const output: Record<string, unknown> = {
    projectName: session.projectName,
    branch: session.branch,
    summary: session.summary,
    tokensCompressed: session.tokensCompressed,
  };

  if (includeTimestamp) {
    output.timestamp = session.timestamp;
  }

  if (includeKeywords) {
    output.keywords = session.keywords;
  }

  if (includeFilePaths) {
    output.filePaths = session.filePaths;
  }

  if (session.metadata) {
    output.metadata = session.metadata;
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Format as plain text (no markdown formatting)
 */
function formatAsPlainText(session: Session, options: FormatOptions): string {
  const { includeTimestamp, includeKeywords, includeFilePaths } = options;

  let text = `Context: ${session.projectName}`;
  if (session.branch) {
    text += ` (${session.branch})`;
  }
  text += '\n\n';

  if (includeTimestamp) {
    const date = new Date(session.timestamp);
    text += `Session Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n\n`;
  }

  if (session.summary) {
    text += `Summary:\n${session.summary}\n\n`;
  }

  if (includeKeywords && session.keywords?.length > 0) {
    text += `Keywords: ${session.keywords.join(', ')}\n\n`;
  }

  if (includeFilePaths && session.filePaths?.length > 0) {
    text += 'Files Worked On:\n';
    session.filePaths.forEach(file => {
      text += `- ${file}\n`;
    });
    text += '\n';
  }

  if (session.tokensCompressed > 0) {
    text += `(Compressed from ${session.tokensCompressed} tokens)\n`;
  }

  return text;
}

/**
 * Truncate text to fit within token limits
 * Uses a simple character-based approximation (1 token ≈ 4 chars)
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (!text || maxTokens <= 0) {
    return '';
  }

  // Approximate token count (1 token ≈ 4 characters for most text)
  const estimatedChars = maxTokens * 4;

  if (text.length <= estimatedChars) {
    return text;
  }

  // Find a good truncation point (preferably at paragraph or sentence boundary)
  let truncationPoint = estimatedChars;

  // Try to truncate at paragraph boundary first
  const paragraphBreak = text.lastIndexOf('\n\n', truncationPoint);
  if (paragraphBreak > estimatedChars * 0.5) {
    truncationPoint = paragraphBreak;
  } else {
    // Fall back to sentence boundary
    const sentenceBreak = text.lastIndexOf('. ', truncationPoint);
    if (sentenceBreak > estimatedChars * 0.5) {
      truncationPoint = sentenceBreak + 2; // Include the period and space
    }
  }

  const truncated = text.substring(0, truncationPoint);

  // Add truncation indicator
  return truncated + '\n\n[...context truncated to fit token limits...]';
}

/**
 * Format from a context file (loaded from storage)
 * Handles both Session and ContextFile types
 */
export function formatContextFile(
  contextFile: ContextFile,
  options: FormatOptions = {}
): string {
  // Extract relevant info from the context file
  const session: Session = {
    id: contextFile.sessionId,
    projectName: contextFile.projectName,
    branch: contextFile.branch,
    timestamp: contextFile.createdAt,
    summary: contextFile.content,
    keywords: (contextFile.frontmatter.keywords as string[]) || [],
    filePaths: (contextFile.frontmatter.filePaths as string[]) || [],
    tokensCompressed: (contextFile.frontmatter.tokensCompressed as number) || 0,
    metadata: contextFile.frontmatter.metadata as any,
  };

  return formatPreamble(session, options);
}

/**
 * Create a simple status message for quick display
 */
export function formatStatusMessage(session: Session): string {
  const date = new Date(session.timestamp);
  const timeAgo = getTimeAgo(date);

  let status = `📍 ${session.projectName}`;
  if (session.branch) {
    status += ` (${session.branch})`;
  }
  status += ` - Last saved ${timeAgo}`;

  if (session.tokensCompressed > 0) {
    status += ` | ${session.tokensCompressed} tokens compressed`;
  }

  return status;
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

/**
 * Estimate token count for a given text
 * Simple approximation: 1 token ≈ 4 characters
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Check if formatted content will exceed token limit
 */
export function willExceedTokenLimit(text: string, maxTokens: number): boolean {
  return estimateTokenCount(text) > maxTokens;
}
