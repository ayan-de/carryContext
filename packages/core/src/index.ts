/**
 * Context Carry Core Package
 *
 * This package contains the core functionality for Context Carry:
 * - watcher.ts - Detect project name + git branch
 * - storage.ts - Read/write .md files with gray-matter
 * - summariser.ts - Compress session via multiple AI APIs
 * - injector.ts - Format LATEST.md as context preamble
 * - scorer.ts - Rank sessions by relevance
 * - config.ts - Configuration management
 * - provider-factory.ts - Registry-based factory for AI providers
 * - interfaces/provider.ts - IProvider interface (abstraction)
 * - providers/ - Provider implementations (Anthropic, OpenAI, Gemini, GLM, Grok)
 */

// Export all core modules
export * from './watcher.js';
export * from './storage.js';
export * from './summariser.js';
export * from './injector.js';
export * from './scorer.js';
export * from './config.js';
export * from './indexer.js';
export * from './provider-factory.js';

// Export provider interface and implementations
export * from './interfaces/provider.js';
export * from './providers/anthropic-provider.js';
export * from './providers/openai-provider.js';
export * from './providers/gemini-provider.js';
export * from './providers/glm-provider.js';
export * from './providers/grok-provider.js';
