/**
 * Transcript Parser - Parse Claude Code JSONL session transcripts
 *
 * Claude Code Stop hooks provide a transcript_path pointing to a JSONL file.
 * Each line is a JSON object following the Anthropic Messages API format.
 */

import { readFile } from 'node:fs/promises';

interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  name?: string;
  content?: string | ContentBlock[];
}

interface TranscriptLine {
  type?: string;
  role?: 'user' | 'assistant';
  content?: string | ContentBlock[];
  message?: {
    role?: 'user' | 'assistant';
    content?: string | ContentBlock[];
  };
}

/**
 * Parse a Claude Code JSONL transcript file into a human-readable string
 * suitable for feeding into the AI summarizer.
 *
 * Claude Code wraps each entry as: { type: "user"|"assistant", message: { role, content } }
 */
export async function parseClaudeTranscript(filePath: string): Promise<string> {
  const raw = await readFile(filePath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());

  const messages: { role: string; content: string }[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as TranscriptLine;

      // Claude Code format: { type: "user"|"assistant", message: { role, content } }
      const role = parsed.message?.role ?? parsed.role;
      const content = parsed.message?.content ?? parsed.content;

      if (!role || !content || (role !== 'user' && role !== 'assistant')) continue;

      const text = extractTextFromContent(content);
      if (text.trim()) {
        messages.push({ role, content: text });
      }
    } catch {
      // Skip malformed lines
    }
  }

  return messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
}

function extractTextFromContent(content: string | ContentBlock[]): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  const parts: string[] = [];

  for (const block of content) {
    if (block.type === 'text' && block.text) {
      parts.push(block.text);
    } else if (block.type === 'tool_use' && block.name) {
      parts.push(`[Tool: ${block.name}]`);
    } else if (block.type === 'tool_result') {
      const resultText =
        typeof block.content === 'string'
          ? block.content
          : JSON.stringify(block.content);
      // Truncate long tool results to avoid flooding the summarizer
      const truncated = resultText.length > 500
        ? resultText.substring(0, 500) + '...'
        : resultText;
      parts.push(`[Tool result: ${truncated}]`);
    }
  }

  return parts.join('\n');
}
