/**
 * Anthropic Provider Implementation
 *
 * LSP: Can be substituted with any other IProvider implementation
 * SRP: Only handles Anthropic-specific logic
 */

import Anthropic from '@anthropic-ai/sdk';
import type { IProvider, SummarizationResult } from '../interfaces/provider.js';
import type { AIProviderConfig, SessionSummary } from 'contextcarry-types';
import { AIProvider } from 'contextcarry-types';

export class AnthropicProvider implements IProvider {
  private client: Anthropic;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey || '',
    });
  }

  getName(): string {
    return 'Anthropic';
  }

  getDefaultModel(): string {
    return 'claude-sonnet-4-6';
  }

  validateConfig(config: AIProviderConfig): { valid: boolean; error?: string } {
    if (!config.apiKey) {
      return { valid: false, error: 'API key is required for Anthropic' };
    }
    return { valid: true };
  }

  async summarize(
    transcript: string,
    model?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<SummarizationResult> {
    const selectedModel = model || this.getDefaultModel();
    const temperature = options?.temperature ?? 0.3;

    const response = await this.client.messages.create({
      model: selectedModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature,
      system: `You are a context summarization assistant. Summarize the transcript into structured JSON:
{
  "mainTopic": "string",
  "keyDecisions": ["string"],
  "filesWorkedOn": ["string"],
  "openQuestions": ["string"],
  "nextSteps": ["string"]
}`,
      messages: [
        {
          role: 'user',
          content: `Summarize this transcript: ${transcript}`,
        },
      ],
    });

    // Parse response to extract summary
    // TODO: Implement proper JSON parsing
    const summary: SessionSummary = {
      mainTopic: 'Work session',
      keyDecisions: [],
      filesWorkedOn: [],
      openQuestions: [],
      nextSteps: [],
    };

    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    const textContent = response.content.find(
      (block): block is { type: 'text'; text: string; citations: any[] | null } => block.type === 'text'
    );

    return {
      summary,
      compressed: textContent?.text || '',
      tokensUsed: inputTokens + outputTokens,
      model: selectedModel,
      provider: this.getName(),
    };
  }

  async compress(transcript: string, maxTokens: number, model?: string): Promise<string> {
    const selectedModel = model || this.getDefaultModel();

    const response = await this.client.messages.create({
      model: selectedModel,
      max_tokens: maxTokens,
      temperature: 0.3,
      system: 'Compress this transcript into the most concise summary possible while preserving key information.',
      messages: [
        {
          role: 'user',
          content: `Compress: ${transcript}`,
        },
      ],
    });

    const textContent = response.content.find(
      (block): block is { type: 'text'; text: string; citations: any[] | null } => block.type === 'text'
    );

    return textContent?.text || '';
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.getDefaultModel(),
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
