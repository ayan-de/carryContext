/**
 * Summariser Module - Compress session via multiple AI APIs
 *
 * Supports: Anthropic, OpenAI, Gemini, GLM, Grok
 */

import type { SessionSummary, AIProvider, AIProviderConfig } from '@contextcarry/types';

export async function summarizeSession(
  transcript: string,
  config: AIProviderConfig
): Promise<SessionSummary> {
  // TODO: Implement session summarisation
  // Will route to appropriate provider based on config.provider
  throw new Error('Not implemented');
}

export async function compressContext(
  transcript: string,
  provider: AIProvider,
  config: AIProviderConfig
): Promise<string> {
  // TODO: Implement context compression
  // Will route to appropriate provider based on provider enum
  throw new Error('Not implemented');
}

/**
 * Provider-specific summarisers
 */
export async function summarizeWithAnthropic(
  transcript: string,
  apiKey: string,
  model?: string
): Promise<SessionSummary> {
  // TODO: Implement Anthropic summarisation
  throw new Error('Not implemented');
}

export async function summarizeWithOpenAI(
  transcript: string,
  apiKey: string,
  model?: string
): Promise<SessionSummary> {
  // TODO: Implement OpenAI summarisation
  throw new Error('Not implemented');
}

export async function summarizeWithGemini(
  transcript: string,
  apiKey: string,
  model?: string
): Promise<SessionSummary> {
  // TODO: Implement Gemini summarisation
  throw new Error('Not implemented');
}

export async function summarizeWithGLM(
  transcript: string,
  apiKey: string,
  model?: string
): Promise<SessionSummary> {
  // TODO: Implement GLM summarisation
  throw new Error('Not implemented');
}

export async function summarizeWithGrok(
  transcript: string,
  apiKey: string,
  model?: string
): Promise<SessionSummary> {
  // TODO: Implement Grok summarisation
  throw new Error('Not implemented');
}
