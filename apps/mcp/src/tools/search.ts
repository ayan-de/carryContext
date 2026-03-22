/**
 * search_context MCP Tool
 *
 * MCP equivalent of `ctx search`. Searches across all saved sessions
 * for a query string and returns matching results ranked by relevance.
 */

import { z } from 'zod';
import type { Tool, FastMCPSessionAuth } from 'fastmcp';
import { loadRegistry, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';
import { handleToolError } from '../utils/error-handler.js';

const searchContextParams = z.object({
  query: z
    .string()
    .describe('The search query to match against session content.'),
  project: z
    .string()
    .optional()
    .describe('Filter results to a specific project.'),
  branch: z
    .string()
    .optional()
    .describe('Filter results to a specific branch.'),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe('Maximum number of results to return (default 10).'),
});

export const searchContextTool: Tool<FastMCPSessionAuth, typeof searchContextParams> = {
  name: 'search_context',
  description:
    'Search across all saved sessions for a keyword or phrase. ' +
    'Returns matching sessions ranked by relevance (match count + recency).',
  parameters: searchContextParams,

  async execute(args) {
    try {
      const registry = await loadRegistry(DEFAULT_STORAGE_CONFIG);
      let sessions = registry.sessions;

      // Apply project/branch filters
      if (args.project) {
        const p = args.project.toLowerCase();
        sessions = sessions.filter(s => s.projectName.toLowerCase().includes(p));
      }
      if (args.branch) {
        const b = args.branch.toLowerCase();
        sessions = sessions.filter(s => s.branch.toLowerCase().includes(b));
      }

      // Search each session
      const queryLower = args.query.toLowerCase();
      const results: { session: typeof sessions[number]; matchCount: number; recency: number }[] = [];

      for (const session of sessions) {
        const text = [session.summary, session.projectName, session.branch]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        // Count occurrences
        let count = 0;
        let idx = 0;
        while ((idx = text.indexOf(queryLower, idx)) !== -1) {
          count++;
          idx += queryLower.length;
        }

        if (count > 0) {
          const ageHours = (Date.now() - (session.timestamp || 0)) / (1000 * 60 * 60);
          const recency = ageHours <= 1 ? 100 : ageHours <= 24 ? 80 : ageHours <= 168 ? 60 : ageHours <= 720 ? 40 : 20;
          results.push({ session, matchCount: count, recency });
        }
      }

      // Sort by weighted score (60% match, 40% recency)
      results.sort((a, b) => {
        const scoreA = Math.min(a.matchCount * 10, 50) * 0.6 + a.recency * 0.4;
        const scoreB = Math.min(b.matchCount * 10, 50) * 0.6 + b.recency * 0.4;
        return scoreB - scoreA;
      });

      // Apply limit
      const limited = results.slice(0, args.limit);

      if (limited.length === 0) {
        return `No sessions matched "${args.query}".`;
      }

      const lines = limited.map((r, i) => {
        const s = r.session;
        const date = new Date(s.timestamp || 0).toISOString().slice(0, 16).replace('T', ' ');
        const summary = (s.summary || '').slice(0, 100);
        return `${i + 1}. **${s.projectName}/${s.branch}** [${s.sessionId.slice(0, 8)}] (${date}, ${r.matchCount} match${r.matchCount > 1 ? 'es' : ''})\n   ${summary}`;
      });

      return `Found ${results.length} result(s) for "${args.query}":\n\n${lines.join('\n\n')}`;
    } catch (error) {
      throw handleToolError(error);
    }
  },
};
