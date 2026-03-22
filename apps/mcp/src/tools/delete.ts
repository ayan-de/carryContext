/**
 * delete_session MCP Tool
 *
 * Deletes a single session by its ID. This is more granular than
 * clear_context, which wipes an entire branch or project.
 */

import { z } from 'zod';
import type { Tool, FastMCPSessionAuth } from 'fastmcp';
import { deleteSession, DEFAULT_STORAGE_CONFIG } from 'contextcarry-core';
import { handleToolError } from '../utils/error-handler.js';

const deleteSessionParams = z.object({
  sessionId: z
    .string()
    .describe('The session ID to delete.'),
});

export const deleteSessionTool: Tool<FastMCPSessionAuth, typeof deleteSessionParams> = {
  name: 'delete_session',
  description: 'Delete a specific session by its ID.',
  parameters: deleteSessionParams,

  async execute(args) {
    try {
      const deleted = await deleteSession(args.sessionId, DEFAULT_STORAGE_CONFIG);

      if (!deleted) {
        return `Session ${args.sessionId} not found.`;
      }

      return `Session ${args.sessionId} deleted.`;
    } catch (error) {
      throw handleToolError(error);
    }
  },
};
