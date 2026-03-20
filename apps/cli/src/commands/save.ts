/**
 * Save Command - Save current session context
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import chalk from 'chalk';
import ora from 'ora';
import {
  detectProject,
  generateSessionId,
  DEFAULT_STORAGE_CONFIG,
  saveSession,
  initializeStorage,
  summarizeSession,
} from '@contextcarry/core';
import type { AIProviderConfig, SessionMetadata } from '@contextcarry/types';
import { AIProvider } from '@contextcarry/types';

interface SaveOptions {
  stdin?: boolean;
  auto?: boolean;
  output?: string;
  project?: string;
  branch?: string;
  file?: string;
  provider?: string;
  apiKey?: string;
  model?: string;
  disableSummarization?: boolean;
}

export const saveCommand = new Command('save')
  .description('Save current session context to storage')
  .option('-s, --stdin', 'Read transcript from stdin')
  .option('-a, --auto', 'Automatic mode (no output, for hooks)')
  .option('-o, --output <path>', 'Output file path (default: use storage)')
  .option('-p, --project <name>', 'Project name override')
  .option('-b, --branch <name>', 'Branch name override')
  .option('-f, --file <path>', 'Read transcript from file')
  .option('--provider <name>', 'AI provider (anthropic, openai, gemini, glm, grok)', 'anthropic')
  .option('--api-key <key>', 'API key (or use ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)')
  .option('--model <name>', 'AI model to use')
  .option('--disable-summarization', 'Save raw transcript without summarization')
  .action(async (options: SaveOptions) => {
    const spinner = options.auto ? ora({ isSilent: true }) : ora('Saving context...').start();

    try {
      // Initialize storage if needed
      await initializeStorage(DEFAULT_STORAGE_CONFIG);

      // Detect project info
      let projectInfo;
      try {
        projectInfo = await detectProject();
      } catch (error) {
        spinner?.warn(chalk.yellow('Could not detect project info, using defaults'));
        projectInfo = {
          name: options.project || 'unknown-project',
          rootPath: process.cwd(),
          branch: 'no-branch',
        };
      }

      // Override with command options
      const projectName = options.project || projectInfo.name;
      const branchName = options.branch || projectInfo.branch;

      if (!options.auto) {
        spinner.text = `Detected project: ${chalk.cyan(projectName)} (${chalk.yellow(branchName)})`;
      }

      // Read transcript
      let transcript = '';
      if (options.stdin) {
        // Read from stdin
        transcript = await readFromStdin();
      } else if (options.file) {
        // Read from file
        transcript = readFileSync(resolve(options.file), 'utf-8');
      } else {
        // For now, provide a sample transcript
        // In a real implementation, this would read from terminal history or clipboard
        if (!options.auto) {
          spinner.warn(chalk.yellow('No transcript provided. Use --stdin or --file to provide transcript.'));
          spinner.info('Demo: Saving with sample transcript...');
          transcript = generateSampleTranscript();
        } else {
          spinner.fail(chalk.red('No transcript provided for auto-save'));
          process.exit(1);
          return;
        }
      }

      if (!transcript.trim()) {
        spinner?.fail(chalk.red('Empty transcript provided'));
        process.exit(1);
        return;
      }

      // Summarize or use raw transcript
      let summary = transcript;
      let keywords: string[] = [];
      let tokensCompressed = 0;

      if (!options.disableSummarization) {
        // Get AI provider configuration
        const providerConfig = getProviderConfig(options);

        spinner.text = 'Summarizing session...';
        const summaryResult = await summarizeSessionFull(transcript, providerConfig);

        summary = summaryResult.compressed || summaryResult.summary.mainTopic;
        keywords = await extractKeywordsFromTranscript(summary);
        tokensCompressed = summaryResult.tokensUsed;

        spinner.text = 'Session summarized';
      } else {
        // Extract keywords from raw transcript
        keywords = await extractKeywordsFromTranscript(transcript);
      }

      // Create session object
      const session = {
        id: generateSessionId(),
        projectName,
        branch: branchName,
        timestamp: Date.now(),
        summary,
        keywords,
        filePaths: [], // Could be enhanced with file extraction
        tokensCompressed,
        metadata: {
          lastCommand: options.provider || 'ctx save',
        } as SessionMetadata,
      };

      spinner.text = 'Saving session...';

      // Save session
      if (options.output) {
        // Save to specified output file
        const { writeContextFile } = await import('@contextcarry/core');
        await writeContextFile(options.output, session.summary, {
          sessionId: session.id,
          projectName: session.projectName,
          branch: session.branch,
          timestamp: session.timestamp,
          keywords: session.keywords,
          tokensCompressed: session.tokensCompressed,
        });
      } else {
        // Save to storage
        await saveSession(session, DEFAULT_STORAGE_CONFIG);
      }

      spinner?.succeed(chalk.green('Context saved successfully'));

      if (!options.auto) {
        console.log('');
        console.log(chalk.bold('Session Details:'));
        console.log(`  ${chalk.cyan('Project:')} ${projectName}`);
        console.log(`  ${chalk.cyan('Branch:')} ${branchName}`);
        console.log(`  ${chalk.cyan('Session ID:')} ${session.id}`);
        console.log(`  ${chalk.cyan('Keywords:')} ${keywords.slice(0, 5).join(', ')}`);

        if (tokensCompressed > 0) {
          console.log(`  ${chalk.cyan('Tokens Compressed:')} ${tokensCompressed}`);
        }

        console.log('');
        console.log(chalk.gray('Use `ctx load` to restore this context in a new session.'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner?.fail(chalk.red(`Failed to save context: ${errorMessage}`));
      process.exit(1);
    }
  });

/**
 * Read from stdin
 */
async function readFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

/**
 * Get provider configuration from options or environment
 */
function getProviderConfig(options: SaveOptions): AIProviderConfig {
  const provider = options.provider || 'anthropic';
  const apiKey = options.apiKey || getApiKeyFromEnv(provider);
  const model = options.model || getDefaultModel(provider);

  return {
    provider: provider as AIProvider,
    apiKey,
    model,
    maxTokens: 4096,
    temperature: 0.3,
  };
}

/**
 * Get API key from environment variables
 */
function getApiKeyFromEnv(provider: string): string | undefined {
  const keyMap: Record<string, string> = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    glm: 'GLM_API_KEY',
    grok: 'GROK_API_KEY',
  };

  const envVar = keyMap[provider as keyof typeof keyMap];
  return envVar ? process.env[envVar] : undefined;
}

/**
 * Get default model for provider
 */
function getDefaultModel(provider: string): string {
  const modelMap: Record<string, string> = {
    anthropic: 'claude-sonnet-4-6',
    openai: 'gpt-4o',
    gemini: 'gemini-2.5-pro',
    glm: 'glm-4-plus',
    grok: 'grok-beta',
  };

  return modelMap[provider] || 'default';
}

/**
 * Extract keywords from transcript
 */
async function extractKeywordsFromTranscript(transcript: string): Promise<string[]> {
  // Simple keyword extraction
  const words = transcript
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !isCommonWord(word));

  // Get unique keywords
  const uniqueWords = Array.from(new Set(words));

  return uniqueWords.slice(0, 10); // Limit to top 10 keywords
}

/**
 * Check if word is common
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'this', 'that', 'with', 'from', 'have', 'been', 'were', 'would',
    'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'into',
    'year', 'your', 'just', 'over', 'also', 'such', 'because', 'these', 'first',
    'being', 'through', 'most', 'must', 'some', 'after', 'back', 'only', 'could',
  ]);

  return commonWords.has(word);
}

/**
 * Generate sample transcript for demo
 */
function generateSampleTranscript(): string {
  return `
Session started on ${new Date().toISOString()}

User: I need to implement a new feature for user authentication
Assistant: I'll help you implement user authentication. Let's start by understanding the requirements.

User: The requirements are:
- User registration with email/password
- Email verification
- Password reset functionality
- Session management with JWT tokens

Assistant: I'll create the authentication system step by step:

1. First, let's set up the database schema for users
2. Then implement the authentication endpoints
3. Add email verification logic
4. Finally, implement password reset

User: Let's start with the database schema
Assistant: I'll create a users table with fields: id, email, password_hash, email_verified, created_at, updated_at

[Implementation steps completed]

User: The authentication endpoints are working great!
Assistant: Excellent! The system is now ready. You can test it by registering a new user and going through the verification process.

Next steps:
- Add role-based access control
- Implement OAuth providers (Google, GitHub)
- Add two-factor authentication
- Create admin dashboard for user management
`;
}

/**
 * Full summarization with additional details
 */
async function summarizeSessionFull(
  transcript: string,
  config: AIProviderConfig
): Promise<{
  summary: any;
  compressed: string;
  tokensUsed: number;
  model: string;
  provider: string;
}> {
  // This would use the actual provider in production
  // For now, return a mock result
  return {
    summary: {
      mainTopic: 'User authentication system implementation',
      keyDecisions: [
        'Use JWT tokens for session management',
        'Implement email verification',
        'Add password reset functionality',
      ],
      filesWorkedOn: [
        'src/auth/user.model.ts',
        'src/auth/auth.controller.ts',
        'src/middleware/auth.middleware.ts',
      ],
      openQuestions: [
        'Should we add OAuth providers next?',
        'How to handle rate limiting?',
      ],
      nextSteps: [
        'Add role-based access control',
        'Implement OAuth providers',
        'Add two-factor authentication',
        'Create admin dashboard',
      ],
    },
    compressed: 'Implemented user authentication system with registration, email verification, and password reset. Created database schema and authentication endpoints. Next: RBAC, OAuth, 2FA, admin dashboard.',
    tokensUsed: 1250,
    model: config.model || 'default',
    provider: config.provider,
  };
}
