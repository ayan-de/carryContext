/**
 * Provider Factory - Registry-based factory for AI providers
 *
 * Follows SOLID principles:
 * - OCP: New providers can be added without modifying existing code
 * - DIP: Depends on abstractions (IProvider), not concrete implementations
 * - SRP: Each concern is separated (registry, factory, adapter)
 */

import { AIProvider, type AIProviderConfig } from 'contextcarry-types';
import type { IProvider } from './interfaces/provider.js';
import { AnthropicProvider } from './providers/anthropic-provider.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { GeminiProvider } from './providers/gemini-provider.js';
import { GLMProvider } from './providers/glm-provider.js';
import { GrokProvider } from './providers/grok-provider.js';

/**
 * Provider Registry - Maps AIProvider enum to provider implementations
 * Open/Closed: New providers register themselves, no switch statements
 */
class ProviderRegistry {
  private providers = new Map<AIProvider, new (config: AIProviderConfig) => IProvider>();

  register(provider: AIProvider, factory: new (config: AIProviderConfig) => IProvider): void {
    this.providers.set(provider, factory);
  }

  get(provider: AIProvider): (new (config: AIProviderConfig) => IProvider) | undefined {
    return this.providers.get(provider);
  }

  getAll(): AIProvider[] {
    return Array.from(this.providers.keys());
  }
}

// Global registry instance
const registry = new ProviderRegistry();

// Register built-in providers
registry.register(AIProvider.ANTHROPIC, AnthropicProvider);
registry.register(AIProvider.OPENAI, OpenAIProvider);
registry.register(AIProvider.GEMINI, GeminiProvider);
registry.register(AIProvider.GLM, GLMProvider);
registry.register(AIProvider.GROK, GrokProvider);

/**
 * Factory for creating provider instances
 * Dependency Inversion: Returns IProvider interface, not concrete types
 */
export function createProvider(config: AIProviderConfig): IProvider {
  const factory = registry.get(config.provider);

  if (!factory) {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  return new factory(config);
}

/**
 * Get available providers from registry
 */
export function getAvailableProviders(): AIProvider[] {
  return registry.getAll();
}

/**
 * Get provider metadata from provider instance
 */
export function getProviderMetadata(provider: AIProvider): { name: string; defaultModel: string } | undefined {
  const factory = registry.get(provider);
  if (!factory) return undefined;

  // Create a dummy instance to get metadata
  const instance = new factory({ provider, apiKey: 'dummy' });
  return {
    name: instance.getName(),
    defaultModel: instance.getDefaultModel(),
  };
}

/**
 * Validate provider config using provider's own validation logic
 */
export function validateProviderConfig(config: AIProviderConfig): { valid: boolean; error?: string } {
  try {
    const provider = createProvider(config);
    return provider.validateConfig(config);
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Register a custom provider (for extensibility)
 */
export function registerProvider(
  provider: AIProvider,
  factory: new (config: AIProviderConfig) => IProvider
): void {
  registry.register(provider, factory);
}
