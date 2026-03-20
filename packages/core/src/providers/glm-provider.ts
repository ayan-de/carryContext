/**
 * GLM (Zhipu AI) Provider Implementation
 */

import axios from 'axios';
import type { IProvider, SummarizationResult } from '../interfaces/provider.js';
import type { AIProviderConfig, SessionSummary } from '@contextcarry/types';

export class GLMProvider implements IProvider {
  private config: AIProviderConfig;
  private httpClient: typeof axios;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.httpClient = axios;
  }

  getName(): string {
    return 'GLM (Zhipu AI)';
  }

  getDefaultModel(): string {
    return 'glm-4-plus';
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
    const baseUrl = this.config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4/';
    // TODO: Implement GLM summarization
    const summary: SessionSummary = {
      mainTopic: 'Work session',
      keyDecisions: [],
      filesWorkedOn: [],
      openQuestions: [],
      nextSteps: [],
    };
    return {
      summary,
      compressed: '',
      tokensUsed: 0,
      model: selectedModel,
      provider: this.getName(),
    };
  }

  async compress(transcript: string, maxTokens: number, model?: string): Promise<string> {
    // TODO: Implement GLM compression
    return '';
  }

  async checkAvailability(): Promise<boolean> {
    // TODO: Implement GLM availability check
    return true;
  }
}
