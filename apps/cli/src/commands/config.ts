/**
 * Config Command - Manage Context Carry configuration
 *
 * ctx config set --provider glm --api-key <key>
 * ctx config show
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, saveConfig, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';

const PROVIDER_DEFAULTS: Record<string, { model: string; baseUrl?: string }> = {
  anthropic: { model: 'claude-sonnet-4-6' },
  openai: { model: 'gpt-4o' },
  gemini: { model: 'gemini-2.5-pro' },
  glm: { model: 'glm-4.5', baseUrl: 'https://api.z.ai/api/coding/paas/v4/' },
  grok: { model: 'grok-beta' },
};

const setCommand = new Command('set')
  .description('Set configuration values')
  .option('-p, --provider <provider>', 'AI provider (anthropic, openai, gemini, glm, grok)')
  .option('-k, --api-key <key>', 'API key for the provider')
  .option('-m, --model <model>', 'Model to use (optional, uses provider default)')
  .option('-b, --base-url <url>', 'Custom base URL (optional)')
  .action(async (options) => {
    if (!options.provider && !options.apiKey) {
      console.error(chalk.red('Provide at least --provider or --api-key'));
      process.exit(1);
    }

    const config = await loadConfig(DEFAULT_STORAGE_CONFIG.dataDir);
    const provider = options.provider || config.defaultProvider || 'anthropic';

    if (!PROVIDER_DEFAULTS[provider]) {
      console.error(chalk.red(`Unknown provider: ${provider}`));
      console.log(`Supported: ${Object.keys(PROVIDER_DEFAULTS).join(', ')}`);
      process.exit(1);
    }

    const defaults = PROVIDER_DEFAULTS[provider];

    // Update defaultProvider
    config.defaultProvider = provider as typeof config.defaultProvider;

    // Merge into provider-specific config
    const existing = (config as unknown as Record<string, unknown>)[provider] as Record<string, unknown> || {};
    (config as unknown as Record<string, unknown>)[provider] = {
      ...existing,
      ...(options.apiKey && { apiKey: options.apiKey }),
      model: options.model || (existing.model as string) || defaults.model,
      ...(defaults.baseUrl && { baseUrl: options.baseUrl || (existing.baseUrl as string) || defaults.baseUrl }),
      ...(options.baseUrl && { baseUrl: options.baseUrl }),
    };

    await saveConfig(config);
    console.log(chalk.green(`✔ Provider set to ${chalk.bold(provider)}`));
    if (options.apiKey) console.log(chalk.gray(`  API key saved to ~/.contextcarry/config.json`));
  });

const showCommand = new Command('show')
  .description('Show current configuration')
  .action(async () => {
    const config = await loadConfig(DEFAULT_STORAGE_CONFIG.dataDir);
    const provider = config.defaultProvider || 'not set';
    const providerCfg = (config as unknown as Record<string, unknown>)[provider] as Record<string, unknown> | undefined;

    console.log(chalk.bold('\nContext Carry Config'));
    console.log(chalk.gray('──────────────────────────'));
    console.log(`Provider:  ${chalk.white(provider)}`);
    if (providerCfg) {
      console.log(`Model:     ${chalk.white((providerCfg.model as string) || 'default')}`);
      console.log(`API key:   ${chalk.white(providerCfg.apiKey ? '***' + String(providerCfg.apiKey).slice(-4) : 'not set')}`);
      if (providerCfg.baseUrl) console.log(`Base URL:  ${chalk.white(providerCfg.baseUrl as string)}`);
    }
    console.log(`Storage:   ${chalk.white(config.dataDir)}`);
  });

export const configCommand = new Command('config')
  .description('Manage configuration')
  .addCommand(setCommand)
  .addCommand(showCommand);
