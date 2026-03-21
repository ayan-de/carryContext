/**
 * GLM (Zhipu AI) Provider Implementation
 * Uses OpenAI-compatible API at https://open.bigmodel.cn/api/paas/v4/
 */

import OpenAI from 'openai';
import type { IProvider, SummarizationResult } from '../interfaces/provider.js';
import type { AIProviderConfig, SessionSummary } from 'contextcarry-types';

export class GLMProvider implements IProvider {
  private client: OpenAI;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey || '',
      baseURL: config.baseUrl || 'https://api.z.ai/api/coding/paas/v4/',
    });
  }

  getName(): string {
    return 'GLM (Zhipu AI)';
  }

  getDefaultModel(): string {
    return 'glm-4.5';
  }

  validateConfig(config: AIProviderConfig): { valid: boolean; error?: string } {
    if (!config.apiKey) {
      return { valid: false, error: 'API key is required for GLM' };
    }
    return { valid: true };
  }

  async summarize(
    transcript: string,
    model?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<SummarizationResult> {
    const selectedModel = model || this.getDefaultModel();

    const response = await this.client.chat.completions.create({
      model: selectedModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a context summarization assistant. Summarize the transcript into structured JSON:
          {
            "mainTopic": "string",
            "keyDecisions": ["string"],
            "filesWorkedOn": ["string"],
            "openQuestions": ["string"],
            "nextSteps": ["string"]
          }`,
        },
        {
          role: 'user',
          content: `Summarize this transcript: ${transcript}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || '';

    let summary: SessionSummary = {
      mainTopic: 'Work session',
      keyDecisions: [],
      filesWorkedOn: [],
      openQuestions: [],
      nextSteps: [],
    };

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = { ...summary, ...parsed };
      }
    } catch {
      // keep default summary
    }

    return {
      summary,
      compressed: text,
      tokensUsed: response.usage?.total_tokens ?? 0,
      model: selectedModel,
      provider: this.getName(),
    };
  }

  async compress(transcript: string, maxTokens: number, model?: string): Promise<string> {
    const selectedModel = model || this.getDefaultModel();

    const response = await this.client.chat.completions.create({
      model: selectedModel,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'Compress this transcript into the most concise summary possible while preserving key information.',
        },
        {
          role: 'user',
          content: `Compress: ${transcript}`,
        },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.getDefaultModel(),
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
