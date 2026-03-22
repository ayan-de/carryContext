/**
 * Error Handler — maps core errors to FastMCP UserError responses
 *
 * WHY THIS EXISTS
 * ───────────────
 * The core package (`contextcarry-core`) throws `ContextCarryError` with
 * typed error codes (API_KEY_MISSING, STORAGE_READ_FAILED, etc.).
 * But MCP clients (Cursor, Windsurf, etc.) don't know about our error codes.
 *
 * FastMCP provides `UserError` — when you throw one of these inside a tool's
 * `execute()` function, FastMCP catches it and returns a structured MCP error
 * response to the client with `isError: true`. The agent sees the error message
 * and can react to it (e.g. ask the user for an API key).
 *
 * If you throw a regular Error instead, FastMCP treats it as an internal
 * server error — the agent gets a generic "internal error" message with no
 * useful detail.
 *
 * HOW IT WORKS
 * ────────────
 * `handleToolError(error)` checks:
 *   1. Is it a `ContextCarryError`? → map to a human-readable `UserError`
 *   2. Is it some other Error?      → wrap in a generic `UserError`
 *   3. Is it not even an Error?     → wrap the stringified value
 *
 * Each tool calls this in its catch block so error handling is consistent
 * across all tools.
 */

import { UserError } from 'fastmcp';
import { ContextCarryError, ErrorCode } from 'contextcarry-types';

/**
 * Human-friendly messages for each error code.
 * These are what the AI agent will see, so they should be actionable.
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Storage
  [ErrorCode.STORAGE_WRITE_FAILED]: 'Failed to write session to storage.',
  [ErrorCode.STORAGE_READ_FAILED]: 'Failed to read session from storage.',
  [ErrorCode.STORAGE_DELETE_FAILED]: 'Failed to delete session from storage.',
  [ErrorCode.STORAGE_DIR_NOT_FOUND]:
    'Context Carry storage directory not found. Run `ctx init` to set up.',
  [ErrorCode.SESSION_NOT_FOUND]: 'No session found for this project/branch.',

  // Git/project
  [ErrorCode.GIT_NOT_FOUND]: 'Git is not installed or not in PATH.',
  [ErrorCode.GIT_COMMAND_FAILED]: 'A git command failed unexpectedly.',
  [ErrorCode.PROJECT_NOT_FOUND]: 'Could not detect project. Is this a valid project directory?',
  [ErrorCode.BRANCH_NOT_FOUND]: 'Could not detect git branch.',

  // API
  [ErrorCode.API_ERROR]: 'AI provider API call failed.',
  [ErrorCode.API_KEY_MISSING]:
    'No API key configured. Run `ctx init` to set your AI provider and key.',
  [ErrorCode.API_RATE_LIMITED]: 'AI provider rate limit reached. Try again shortly.',

  // Config
  [ErrorCode.CONFIG_INVALID]: 'Configuration file is invalid. Check ~/.contextcarry/config.json.',
  [ErrorCode.CONFIG_MISSING]:
    'No configuration found. Run `ctx init` to create config.json.',

  // Validation
  [ErrorCode.VALIDATION_FAILED]: 'Input validation failed.',
  [ErrorCode.INVALID_ARGUMENT]: 'Invalid argument provided.',

  // MCP
  [ErrorCode.MCP_NOT_INITIALIZED]: 'MCP server not properly initialized.',
  [ErrorCode.MCP_TOOL_FAILED]: 'MCP tool execution failed.',
};

/**
 * Convert any error into a FastMCP `UserError`.
 *
 * Call this in every tool's catch block:
 * ```ts
 * execute: async (args) => {
 *   try {
 *     // ... tool logic
 *   } catch (error) {
 *     throw handleToolError(error);
 *   }
 * }
 * ```
 */
export function handleToolError(error: unknown): UserError {
  // Known error from our core package — use the mapped message
  if (error instanceof ContextCarryError) {
    const message = ERROR_MESSAGES[error.code] ?? error.message;
    return new UserError(`${message} [${error.code}]`);
  }

  // Unknown Error — preserve the message
  if (error instanceof Error) {
    return new UserError(error.message);
  }

  // Not even an Error object (shouldn't happen, but be safe)
  return new UserError(String(error));
}
