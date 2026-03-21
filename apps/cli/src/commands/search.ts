/**
 * Search Command - Search across all saved sessions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadRegistry, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';
import type { SearchOptions } from 'contextcarry-types';

interface SearchCommandOptions {
  project?: string;
  branch?: string;
  limit?: string;
  caseSensitive?: boolean;
}

interface SearchResult {
  session: any;
  relevanceScore: number;
  matchCount: number;
  highlightedSummary: string;
}

export const searchCommand = new Command('search')
  .alias('grep')
  .description('Search across all saved sessions')
  .argument('<query>', 'Search query')
  .option('-p, --project <name>', 'Filter by project name')
  .option('-b, --branch <name>', 'Filter by branch')
  .option('-l, --limit <number>', 'Limit number of results')
  .option('-c, --case-sensitive', 'Enable case-sensitive search')
  .action(async (query: string, options: SearchCommandOptions) => {
    if (!query || query.trim() === '') {
      console.log(chalk.red('Error: Search query is required'));
      console.log(chalk.gray('Usage: ctx search <query>'));
      process.exit(1);
      return;
    }

    const spinner = ora(`Searching for "${query}"...`).start();

    try {
      // Load session registry
      const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);

      // Search through all sessions
      const results = searchSessions(registry.sessions, query, options);

      spinner.succeed(chalk.green(`Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`));

      // Display results
      displaySearchResults(query, results);

      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`Failed to search: ${errorMessage}`));
      process.exit(1);
    }
  });

/**
 * Search sessions for query matches
 */
function searchSessions(sessions: any[], query: string, options: SearchCommandOptions): SearchResult[] {
  const results: SearchResult[] = [];

  for (const session of sessions) {
    // Apply project/branch filters
    if (options.project) {
      const projectName = options.project.toLowerCase();
      if (!session.projectName.toLowerCase().includes(projectName)) {
        continue;
      }
    }

    if (options.branch) {
      const branchName = options.branch.toLowerCase();
      if (!session.branch.toLowerCase().includes(branchName)) {
        continue;
      }
    }

    // Search for matches
    const matchResult = searchInText(session.summary, query, options.caseSensitive);

    // Also search in project name and branch
    const projectMatch = searchInText(session.projectName, query, options.caseSensitive).count > 0;
    const branchMatch = searchInText(session.branch, query, options.caseSensitive).count > 0;

    const totalMatches = matchResult.count + (projectMatch ? 1 : 0) + (branchMatch ? 1 : 0);

    if (totalMatches > 0) {
      // Calculate relevance score based on recency and match count
      const recencyScore = calculateRecencyScore(session.timestamp);
      const matchScore = Math.min(totalMatches * 10, 50);
      const relevanceScore = recencyScore * 0.4 + matchScore * 0.6;

      results.push({
        session,
        relevanceScore,
        matchCount: totalMatches,
        highlightedSummary: matchResult.highlightedText,
      });
    }
  }

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Apply limit if specified
  const limit = options.limit ? parseInt(options.limit, 10) : undefined;
  if (limit && limit > 0) {
    return results.slice(0, limit);
  }

  return results;
}

/**
 * Search for query in text and return match count with highlighted text
 */
function searchInText(text: string, query: string, caseSensitive: boolean = false): {
  count: number;
  highlightedText: string;
} {
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  // Find all matches
  const regex = new RegExp(escapeRegExp(searchQuery), 'g');
  const matches = searchText.match(regex);
  const count = matches ? matches.length : 0;

  // Create highlighted version
  let highlightedText = '';
  let lastIndex = 0;
  const originalRegex = new RegExp(escapeRegExp(query), caseSensitive ? 'g' : 'gi');

  let match: RegExpExecArray | null;
  while ((match = originalRegex.exec(text)) !== null) {
    highlightedText += text.substring(lastIndex, match.index!);
    highlightedText += chalk.bgYellow.bold.black(match[0]);
    lastIndex = match.index! + match[0].length;
  }
  highlightedText += text.substring(lastIndex);

  return { count, highlightedText };
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate recency score (0-100)
 */
function calculateRecencyScore(timestamp: number): number {
  const now = Date.now();
  const ageMs = now - timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 1) return 100;
  if (ageHours <= 24) return 80;
  if (ageHours <= 168) return 60; // 7 days
  if (ageHours <= 720) return 40; // 30 days
  return 20;
}

/**
 * Display search results
 */
function displaySearchResults(query: string, results: SearchResult[]): void {
  if (results.length === 0) {
    console.log('');
    console.log(chalk.yellow('No matches found.'));
    console.log(chalk.gray('Try a different search term or use `ctx list` to see all sessions.'));
    return;
  }

  console.log('');

  results.forEach((result, index) => {
    const { session, relevanceScore, matchCount, highlightedSummary } = result;

    // Result header
    const header = `${index + 1}. ${session.projectName} - ${session.branch}`;
    console.log(chalk.bold(header));
    console.log(chalk.gray('   ' + '·'.repeat(60)));

    // Session info
    console.log('   ' + chalk.dim('Session ID:') + ' ' + session.sessionId.substring(0, 12) + '...');
    console.log('   ' + chalk.dim('Date:') + ' ' + formatDate(session.timestamp));
    console.log('   ' + chalk.dim('Matches:') + ' ' + chalk.green(matchCount.toString()) + ' | ' + chalk.dim('Relevance:') + ' ' + chalk.blue(relevanceScore.toFixed(1)) + '%');

    // Highlighted summary
    console.log('');
    console.log('   ' + chalk.dim('Summary:'));
    const truncatedSummary = truncateToLineLength(highlightedSummary, 60);
    console.log('   ' + truncatedSummary);

    // Separator between results
    if (index < results.length - 1) {
      console.log('');
      console.log(chalk.gray('   ' + '·'.repeat(60)));
      console.log('');
    }
  });

  console.log('');
  console.log(chalk.gray('Showing ' + results.length + ' result' + (results.length !== 1 ? 's' : '')));
  console.log(chalk.dim('💡 Tips:'));
  console.log(chalk.dim('   - Use ctx load --session <id> to view full context'));
  console.log(chalk.dim('   - Highlighted terms in yellow matched your query'));
  console.log(chalk.dim('   - Higher relevance % indicates more recent/matching sessions'));
}

/**
 * Truncate text to fit within line length
 */
function truncateToLineLength(text: string, maxLength: number): string {
  // Strip ANSI codes for length calculation
  const strippedText = text.replace(/\x1b\[[0-9;]*m/g, '');

  if (strippedText.length <= maxLength) {
    return text;
  }

  // Find a good break point (preferably at a space)
  const truncated = strippedText.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.5) {
    return text.substring(0, lastSpace) + '...';
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format timestamp for display
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return diffHours + 'h ago';
  } else if (diffDays < 7) {
    return diffDays + 'd ago';
  } else {
    return date.toLocaleDateString();
  }
}
