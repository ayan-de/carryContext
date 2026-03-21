/**
 * Config Module - Configuration management for Context Carry
 *
 * Handles reading/writing config.json from ~/.contextcarry/
 * with schema validation and default value merging.
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AppConfig,
  ScorerConfig,
  ScoringWeights,
  AIProvider,
} from 'contextcarry-types';
import { ContextCarryError, ErrorCode } from 'contextcarry-types';

// ============================================================================
// Constants
// ============================================================================

export const CONFIG_VERSION = '1.0.0';
export const CONFIG_FILE_NAME = 'config.json';

/**
 * Default scoring weights for session relevance
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  recency: 0.3,
  branchMatch: 0.3,
  fileOverlap: 0.2,
  keywordSimilarity: 0.2,
};

/**
 * Default scorer configuration
 */
export const DEFAULT_SCORER_CONFIG: ScorerConfig = {
  weights: DEFAULT_SCORING_WEIGHTS,
  minRelevanceScore: 0.1,
};

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  version: CONFIG_VERSION,
  dataDir: join(process.env.HOME || process.env.USERPROFILE || '', '.contextcarry'),
  maxContextTokens: 4000,
  autoSave: false,
  autoLoad: false,
  scorer: DEFAULT_SCORER_CONFIG,
};

// ============================================================================
// Config Loading
// ============================================================================

/**
 * Get the path to the config file
 */
export function getConfigPath(dataDir?: string): string {
  const dir = dataDir || DEFAULT_CONFIG.dataDir;
  return join(dir, CONFIG_FILE_NAME);
}

/**
 * Check if a config file exists
 */
export async function configExists(dataDir?: string): Promise<boolean> {
  const configPath = getConfigPath(dataDir);
  try {
    await access(configPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load configuration from disk
 * Falls back to defaults if file doesn't exist
 */
export async function loadConfig(dataDir?: string): Promise<AppConfig> {
  const configPath = getConfigPath(dataDir);

  try {
    await access(configPath);
  } catch {
    // Config doesn't exist, return defaults
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Merge with defaults (shallow merge for top-level, deep for nested objects)
    const config = mergeWithDefaults(parsed);

    // Validate the config
    validateConfig(config);

    return config;
  } catch (error) {
    if (error instanceof ContextCarryError) {
      throw error;
    }
    throw new ContextCarryError(
      `Failed to parse config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCode.CONFIG_INVALID,
      { path: configPath }
    );
  }
}

/**
 * Save configuration to disk
 */
export async function saveConfig(config: AppConfig, dataDir?: string): Promise<void> {
  const configPath = getConfigPath(dataDir);

  try {
    // Validate before saving
    validateConfig(config);

    // Ensure version is set
    const configToSave: AppConfig = {
      ...config,
      version: CONFIG_VERSION,
    };

    const content = JSON.stringify(configToSave, null, 2);
    await writeFile(configPath, content, 'utf-8');
  } catch (error) {
    if (error instanceof ContextCarryError) {
      throw error;
    }
    throw new ContextCarryError(
      `Failed to save config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCode.CONFIG_INVALID,
      { path: configPath }
    );
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): AppConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Reset configuration to defaults
 */
export async function resetConfig(dataDir?: string): Promise<AppConfig> {
  const defaultConfig = getDefaultConfig();
  await saveConfig(defaultConfig, dataDir);
  return defaultConfig;
}

// ============================================================================
// Config Validation
// ============================================================================

/**
 * Validate configuration values
 */
export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  // Validate dataDir
  if (config.dataDir && typeof config.dataDir !== 'string') {
    errors.push('dataDir must be a string');
  }

  // Validate maxContextTokens
  if (config.maxContextTokens !== undefined) {
    if (typeof config.maxContextTokens !== 'number' || config.maxContextTokens < 0) {
      errors.push('maxContextTokens must be a positive number');
    }
  }

  // Validate autoSave
  if (config.autoSave !== undefined && typeof config.autoSave !== 'boolean') {
    errors.push('autoSave must be a boolean');
  }

  // Validate autoLoad
  if (config.autoLoad !== undefined && typeof config.autoLoad !== 'boolean') {
    errors.push('autoLoad must be a boolean');
  }

  // Validate defaultProvider
  if (config.defaultProvider !== undefined) {
    const validProviders = ['anthropic', 'openai', 'gemini', 'glm', 'grok', 'claude_code', 'copilot'];
    if (!validProviders.includes(config.defaultProvider)) {
      errors.push(`defaultProvider must be one of: ${validProviders.join(', ')}`);
    }
  }

  // Validate scorer config
  if (config.scorer) {
    const scorerErrors = validateScorerConfig(config.scorer);
    errors.push(...scorerErrors);
  }

  // Validate provider configs
  if (config.anthropic) {
    const providerErrors = validateProviderConfig(config.anthropic, 'anthropic');
    errors.push(...providerErrors);
  }

  if (config.openai) {
    const providerErrors = validateProviderConfig(config.openai, 'openai');
    errors.push(...providerErrors);
  }

  if (config.gemini) {
    const providerErrors = validateProviderConfig(config.gemini, 'gemini');
    errors.push(...providerErrors);
  }

  if (config.glm) {
    const providerErrors = validateProviderConfig(config.glm, 'glm');
    errors.push(...providerErrors);
  }

  if (config.grok) {
    const providerErrors = validateProviderConfig(config.grok, 'grok');
    errors.push(...providerErrors);
  }

  if (errors.length > 0) {
    throw new ContextCarryError(
      `Config validation failed: ${errors.join('; ')}`,
      ErrorCode.CONFIG_INVALID,
      { errors }
    );
  }
}

/**
 * Validate scorer configuration
 */
function validateScorerConfig(scorer: ScorerConfig): string[] {
  const errors: string[] = [];

  if (scorer.weights) {
    const { recency, branchMatch, fileOverlap, keywordSimilarity } = scorer.weights;
    const weights = [recency, branchMatch, fileOverlap, keywordSimilarity];

    // Check all weights are numbers between 0 and 1
    for (const [name, value] of [
      ['recency', recency],
      ['branchMatch', branchMatch],
      ['fileOverlap', fileOverlap],
      ['keywordSimilarity', keywordSimilarity],
    ] as const) {
      if (value !== undefined) {
        if (typeof value !== 'number' || value < 0 || value > 1) {
          errors.push(`scorer.weights.${name} must be a number between 0 and 1`);
        }
      }
    }

    // Check weights sum to approximately 1
    const allDefined = weights.every((w) => w !== undefined);
    if (allDefined) {
      const sum = weights.reduce((a, b) => a! + b!, 0);
      if (Math.abs(sum - 1) > 0.01) {
        errors.push(`scorer.weights must sum to 1 (got ${sum?.toFixed(2)})`);
      }
    }
  }

  if (scorer.minRelevanceScore !== undefined) {
    if (typeof scorer.minRelevanceScore !== 'number' || scorer.minRelevanceScore < 0 || scorer.minRelevanceScore > 1) {
      errors.push('scorer.minRelevanceScore must be a number between 0 and 1');
    }
  }

  return errors;
}

/**
 * Validate provider-specific configuration
 */
function validateProviderConfig(
  config: { apiKey?: string; model?: string; maxTokens?: number; temperature?: number },
  providerName: string
): string[] {
  const errors: string[] = [];

  if (config.apiKey !== undefined && typeof config.apiKey !== 'string') {
    errors.push(`${providerName}.apiKey must be a string`);
  }

  if (config.model !== undefined && typeof config.model !== 'string') {
    errors.push(`${providerName}.model must be a string`);
  }

  if (config.maxTokens !== undefined) {
    if (typeof config.maxTokens !== 'number' || config.maxTokens < 1) {
      errors.push(`${providerName}.maxTokens must be a positive number`);
    }
  }

  if (config.temperature !== undefined) {
    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
      errors.push(`${providerName}.temperature must be a number between 0 and 2`);
    }
  }

  return errors;
}

// ============================================================================
// Config Merging
// ============================================================================

/**
 * Merge user config with defaults
 */
function mergeWithDefaults(userConfig: Partial<AppConfig>): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    // Deep merge scorer config
    scorer: userConfig.scorer
      ? {
          ...DEFAULT_SCORER_CONFIG,
          ...userConfig.scorer,
          weights: userConfig.scorer.weights
            ? { ...DEFAULT_SCORING_WEIGHTS, ...userConfig.scorer.weights }
            : DEFAULT_SCORING_WEIGHTS,
        }
      : DEFAULT_SCORER_CONFIG,
  };
}

// ============================================================================
// Config Helpers
// ============================================================================

/**
 * Get a specific config value by path
 */
export function getConfigValue<T>(config: AppConfig, path: string): T | undefined {
  const parts = path.split('.');
  let current: unknown = config;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current as T;
}

/**
 * Set a specific config value by path
 */
export function setConfigValue(config: AppConfig, path: string, value: unknown): AppConfig {
  const parts = path.split('.');
  if (parts.length === 0) return config;

  const result = { ...config };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    current[part] = { ...((current[part] as Record<string, unknown>) || {}) };
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    current[lastPart] = value;
  }
  return result;
}

/**
 * Check if API key is configured for a provider
 */
export function hasApiKey(config: AppConfig, provider: AIProvider): boolean {
  switch (provider) {
    case 'anthropic':
      return !!config.anthropic?.apiKey || !!process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return !!config.openai?.apiKey || !!process.env.OPENAI_API_KEY;
    case 'gemini':
      return !!config.gemini?.apiKey || !!process.env.GOOGLE_API_KEY;
    case 'glm':
      return !!config.glm?.apiKey || !!process.env.GLM_API_KEY;
    case 'grok':
      return !!config.grok?.apiKey || !!process.env.GROK_API_KEY;
    case 'claude_code':
    case 'copilot':
      return true; // These don't need API keys
    default:
      return false;
  }
}

/**
 * Get the effective API key for a provider (config or env var)
 */
export function getApiKey(config: AppConfig, provider: AIProvider): string | undefined {
  switch (provider) {
    case 'anthropic':
      return config.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return config.openai?.apiKey || process.env.OPENAI_API_KEY;
    case 'gemini':
      return config.gemini?.apiKey || process.env.GOOGLE_API_KEY;
    case 'glm':
      return config.glm?.apiKey || process.env.GLM_API_KEY;
    case 'grok':
      return config.grok?.apiKey || process.env.GROK_API_KEY;
    default:
      return undefined;
  }
}
