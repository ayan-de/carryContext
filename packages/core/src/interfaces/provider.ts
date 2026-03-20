/**
 * IProvider Interface - Abstraction for AI provider implementations
 *
 * DIP: High-level modules depend on this interface, not concrete implementations
 */

import type { SessionSummary } from '@contextcarry/types';

/**
 * Summarization result with metadata
 */
export interface SummarizationResult {
  summary: SessionSummary;
  compressed: string;
  tokensUsed: number;
  model: string;
  provider: string;
}

/**
 * Provider interface - All providers must implement this
 * Interface Segregation: Focused, single-responsibility interface
 */
export interface IProvider {
  /**
   * Get provider name for display purposes
   */
  getName(): string;

  /**
   * Get default model for this provider
   */
  getDefaultModel(): string;

  /**
   * Validate the configuration for this provider
   * Returns error message if invalid, or undefined if valid
   */
  validateConfig(config: { apiKey?: string; model?: string; baseUrl?: string }): {
    valid: boolean;
    error?: string;
  };

  /**
   * Summarize a transcript into structured summary
   */
  summarize(transcript: string, model?: string, options?: SummarizeOptions): Promise<SummarizationResult>;

  /**
   * Compress a transcript to fit within token limits
   */
  compress(transcript: string, maxTokens: number, model?: string): Promise<string>;

  /**
   * Check if the provider is available (has valid credentials)
   */
  checkAvailability(): Promise<boolean>;
}

/**
 * Options for summarization
 */
export interface SummarizeOptions {
  temperature?: number;
  maxTokens?: number;
  includeMetadata?: boolean;
}
