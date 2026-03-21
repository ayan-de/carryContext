/**
 * Hook Command - Process Claude Code hook payloads
 *
 * Called automatically by Claude Code's hook system, not by users directly.
 * Reads JSON payload from stdin and handles Stop events by saving session context.
 */

import { Command } from 'commander';
import {
  detectProject,
  generateSessionId,
  DEFAULT_STORAGE_CONFIG,
  saveSession,
  initializeStorage,
  summarizeSessionFull,
  parseClaudeTranscript,
  loadConfig,
  getApiKey,
} from 'contextcarry-core';
import type { AIProviderConfig, SessionMetadata } from 'contextcarry-types';
import { AIProvider } from 'contextcarry-types';

interface HookPayload {
  event?: string;
  session_id?: string;
  transcript_path?: string;
  stop_hook_active?: boolean;
  hook_event_name?: string;
}

export const hookCommand = new Command('hook')
  .description('Process Claude Code hook payloads (called by Claude Code, not users)')
  .action(async () => {
    try {
      const raw = await readStdin();
      if (!raw.trim()) process.exit(0);

      let payload: HookPayload;
      try {
        payload = JSON.parse(raw);
      } catch {
        process.exit(0);
      }

      // Determine event type from payload
      const event = payload.hook_event_name || payload.event || '';

      if (event === 'Stop' || event === 'stop') {
        await handleStop(payload);
      }

      process.exit(0);
    } catch {
      // Never fail the hook — exit 0 silently
      process.exit(0);
    }
  });

async function handleStop(payload: HookPayload): Promise<void> {
  if (!payload.transcript_path) return;

  const transcript = await parseClaudeTranscript(payload.transcript_path).catch(() => '');
  if (!transcript.trim()) return;

  const projectInfo = await detectProject().catch(() => ({
    name: 'unknown-project',
    rootPath: process.cwd(),
    branch: 'no-branch',
    gitRepo: false,
  }));

  const providerConfig = await getProviderConfig();

  // If no API key, save raw transcript without summarization
  let summary = transcript;
  let tokensCompressed = 0;

  if (providerConfig.apiKey) {
    try {
      const result = await summarizeSessionFull(transcript, providerConfig);
      summary = result.compressed || result.summary.mainTopic;
      tokensCompressed = result.tokensUsed;
    } catch {
      // Fall back to raw transcript on summarization failure
      summary = transcript;
    }
  }

  const keywords = extractKeywords(summary);

  const session = {
    id: generateSessionId(),
    projectName: projectInfo.name,
    branch: projectInfo.branch,
    timestamp: Date.now(),
    summary,
    keywords,
    filePaths: [],
    tokensCompressed,
    metadata: {
      lastCommand: 'ctx hook (Stop)',
      claudeSessionId: payload.session_id,
    } as SessionMetadata,
  };

  await initializeStorage(DEFAULT_STORAGE_CONFIG);
  await saveSession(session, DEFAULT_STORAGE_CONFIG);
}

async function getProviderConfig(): Promise<AIProviderConfig> {
  const envKeyMap: Record<string, string> = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    glm: 'GLM_API_KEY',
    grok: 'GROK_API_KEY',
  };

  const modelMap: Record<string, string> = {
    anthropic: 'claude-sonnet-4-6',
    openai: 'gpt-4o',
    gemini: 'gemini-2.5-pro',
    glm: 'glm-4.5',
    grok: 'grok-beta',
  };

  // Load config.json for stored keys + defaultProvider
  const config = await loadConfig().catch(() => null);
  const provider = (process.env.CTX_PROVIDER || config?.defaultProvider || 'anthropic') as AIProvider;

  // API key: env var takes priority, then config.json
  const apiKey =
    process.env[envKeyMap[provider] ?? ''] ||
    (config ? getApiKey(config, provider) : undefined);

  return {
    provider,
    apiKey,
    model: modelMap[provider] ?? 'default',
    maxTokens: 4096,
    temperature: 0.3,
  };
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'this', 'that', 'with', 'from', 'have', 'been', 'were', 'would',
    'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'into',
    'year', 'your', 'just', 'over', 'also', 'such', 'because', 'these', 'first',
    'being', 'through', 'most', 'must', 'some', 'after', 'back', 'only', 'could',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !commonWords.has(w));

  return Array.from(new Set(words)).slice(0, 10);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
    // If stdin has no data after 3s, resolve empty
    setTimeout(() => resolve(data), 3000);
  });
}
