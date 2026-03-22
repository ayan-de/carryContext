/**
 * save_context MCP Tool
 *
 * This is the MCP equivalent of `ctx save --stdin`. An agent (Cursor, Windsurf,
 * etc.) calls this tool with a raw transcript and we:
 *
 *   1. Resolve the project + branch from `cwd`
 *   2. Load the user's config to get their AI provider + API key
 *   3. Summarise the transcript via the configured AI provider
 *   4. Write LATEST.md + a timestamped archive to ~/.contextcarry/<project>/<branch>/
 *   5. Return a confirmation message to the agent
 *
 * The agent can optionally skip summarisation by setting `skipSummarisation: true`,
 * in which case the raw transcript is stored directly (useful when the agent
 * has already compressed the context itself).
 */

import { z } from 'zod';
import type { Tool, FastMCPSessionAuth } from 'fastmcp';
import {
  generateSessionId,
  initializeStorage,
  saveSession,
  summarizeSessionFull,
  loadConfig,
  DEFAULT_STORAGE_CONFIG,
} from 'contextcarry-core';
import type { AIProviderConfig, SessionMetadata } from 'contextcarry-types';
import { AIProvider } from 'contextcarry-types';
import { resolveProject } from '../utils/resolve-project.js';
import { handleToolError } from '../utils/error-handler.js';

/**
 * Map of provider enum values → environment variable names.
 * The MCP server reads API keys from the user's config.json first,
 * then falls back to environment variables (same as the CLI).
 */
const API_KEY_ENV_MAP: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  glm: 'GLM_API_KEY',
  grok: 'GROK_API_KEY',
};

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  gemini: 'gemini-2.5-pro',
  glm: 'glm-4-plus',
  grok: 'grok-beta',
};

/**
 * Simple keyword extraction (same logic as the CLI).
 * Pulls distinct 4+ letter words that aren't common stop-words.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'this', 'that', 'with', 'from', 'have', 'been', 'were', 'would',
    'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'into',
    'year', 'your', 'just', 'over', 'also', 'such', 'because', 'these', 'first',
    'being', 'through', 'most', 'must', 'some', 'after', 'back', 'only', 'could',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  return [...new Set(words)].slice(0, 10);
}

/**
 * Build an AIProviderConfig from the user's config.json + env vars.
 */
async function resolveProviderConfig(): Promise<AIProviderConfig> {
  const appConfig = await loadConfig();

  const provider = appConfig.defaultProvider ?? AIProvider.ANTHROPIC;
  const providerKey = provider as string;

  // Try config.json first (e.g. appConfig.anthropic.apiKey), then env var
  const providerSection = appConfig[providerKey as keyof typeof appConfig] as
    | { apiKey?: string; model?: string } | undefined;

  const apiKey =
    providerSection?.apiKey
    ?? process.env[API_KEY_ENV_MAP[providerKey] ?? '']
    ?? undefined;

  const model =
    providerSection?.model
    ?? DEFAULT_MODELS[providerKey]
    ?? 'default';

  return {
    provider,
    apiKey,
    model,
    maxTokens: 4096,
    temperature: 0.3,
  };
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const saveContextParams = z.object({
  cwd: z
    .string()
    .optional()
    .describe('Working directory of the project. Falls back to server cwd.'),
  transcript: z
    .string()
    .describe('The raw session transcript to save.'),
  skipSummarisation: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, store the transcript as-is without AI summarisation.'),
});

// ─── Tool definition ────────────────────────────────────────────────────────

export const saveContextTool: Tool<FastMCPSessionAuth, typeof saveContextParams> = {
  name: 'save_context',
  description:
    'Save session context. Accepts a raw transcript, summarises it via AI, ' +
    'and stores it as the latest context for the current project and branch.',
  parameters: saveContextParams,

  async execute(args) {
    try {
      // 1. Bootstrap storage if first run
      await initializeStorage(DEFAULT_STORAGE_CONFIG);

      // 2. Figure out which project + branch we're saving for
      const project = await resolveProject(args.cwd);

      // 3. Summarise (or skip)
      let summary = args.transcript;
      let keywords: string[] = [];
      let tokensCompressed = 0;

      if (!args.skipSummarisation) {
        const providerConfig = await resolveProviderConfig();
        const result = await summarizeSessionFull(args.transcript, providerConfig);
        summary = result.compressed || result.summary.mainTopic;
        keywords = extractKeywords(summary);
        tokensCompressed = result.tokensUsed;
      } else {
        keywords = extractKeywords(args.transcript);
      }

      // 4. Build the session object and persist it
      const session = {
        id: generateSessionId(),
        projectName: project.name,
        branch: project.branch,
        timestamp: Date.now(),
        summary,
        keywords,
        filePaths: [] as string[],
        tokensCompressed,
        metadata: { lastCommand: 'mcp:save_context' } as SessionMetadata,
      };

      await saveSession(session, DEFAULT_STORAGE_CONFIG);

      // 5. Return confirmation to the agent
      return `Context saved for ${project.name}/${project.branch} (session ${session.id})`;
    } catch (error) {
      throw handleToolError(error);
    }
  },
};
