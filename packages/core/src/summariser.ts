/**
 * Summariser Module - Compress session via multiple AI APIs
 *
 * Supports: Anthropic, OpenAI, Gemini, GLM, Grok
 *
 * Uses provider factory pattern for extensibility
 */

import type { SessionSummary, AIProvider, AIProviderConfig } from 'contextcarry-types';
import { createProvider } from './provider-factory.js';

/**
 * Summarize a session transcript into structured format
 * Routes to appropriate provider based on config
 */
export async function summarizeSession(
  transcript: string,
  config: AIProviderConfig
): Promise<SessionSummary> {
  const provider = createProvider(config);
  const result = await provider.summarize(
    transcript,
    config.model,
    {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    }
  );

  return result.summary;
}

/**
 * Compress a transcript to fit within token limits
 * Routes to appropriate provider based on provider enum
 */
export async function compressContext(
  transcript: string,
  provider: AIProvider,
  config: AIProviderConfig,
  maxTokens: number = 4096
): Promise<string> {
  const providerInstance = createProvider({ ...config, provider });
  return providerInstance.compress(transcript, maxTokens, config.model);
}

/**
 * Summarize with full result including metadata
 * Returns token usage, model info, and both summary and compressed text
 */
export async function summarizeSessionFull(
  transcript: string,
  config: AIProviderConfig
): Promise<{
  summary: SessionSummary;
  compressed: string;
  tokensUsed: number;
  model: string;
  provider: string;
}> {
  const provider = createProvider(config);
  const result = await provider.summarize(
    transcript,
    config.model,
    {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    }
  );

  return result;
}

/**
 * Check if a provider is available with the given credentials
 */
export async function checkProviderAvailability(
  provider: AIProvider,
  config: AIProviderConfig
): Promise<boolean> {
  try {
    const providerInstance = createProvider({ ...config, provider });
    return await providerInstance.checkAvailability();
  } catch (error) {
    return false;
  }
}

/**
 * Extract keywords from transcript for search indexing
 * Uses the summarize method and extracts from key decisions and next steps
 */
export async function extractKeywordsFromSummary(
  transcript: string,
  config: AIProviderConfig
): Promise<string[]> {
  const summary = await summarizeSession(transcript, config);

  // Combine key decisions and next steps as keywords
  const keywords: string[] = [
    ...summary.keyDecisions,
    ...summary.nextSteps,
    ...summary.filesWorkedOn,
  ];

  // Extract unique keywords and filter short ones
  const uniqueKeywords = Array.from(new Set(keywords))
    .filter(keyword => keyword.length > 3);

  return uniqueKeywords;
}

/**
 * Validate provider configuration before use
 */
export function validateProviderConfigForSummarizer(config: AIProviderConfig): {
  valid: boolean;
  error?: string;
} {
  try {
    const provider = createProvider(config);
    return provider.validateConfig(config);
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
