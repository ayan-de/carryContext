/**
 * Context Carry - Shared TypeScript Interfaces
 */

// ============================================================================
// Core Session Types
// ============================================================================

export interface Session {
  id: string;
  projectName: string;
  branch: string;
  timestamp: number;
  summary: string;
  keywords: string[];
  filePaths: string[];
  tokensCompressed: number;
  metadata?: SessionMetadata;
}

export interface SessionMetadata {
  durationMs?: number;
  toolsUsed?: string[];
  filesModified?: string[];
  lastCommand?: string;
}

export interface SessionSummary {
  mainTopic: string;
  keyDecisions: string[];
  filesWorkedOn: string[];
  openQuestions: string[];
  nextSteps: string[];
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageConfig {
  dataDir: string;
  maxSessionsPerProject: number;
  archiveAfterDays: number;
  compressArchives: boolean;
}

export interface ContextFile {
  sessionId: string;
  projectName: string;
  branch: string;
  createdAt: number;
  updatedAt: number;
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface SessionRegistry {
  sessions: RegistryEntry[];
  lastUpdated: number;
}

export interface RegistryEntry {
  sessionId: string;
  projectName: string;
  branch: string;
  timestamp: number;
  filePath: string;
  summary: string;
}

// ============================================================================
// Watcher/Project Detection Types
// ============================================================================

export interface ProjectInfo {
  name: string;
  rootPath: string;
  branch: string;
  gitRepo?: boolean;
  lastCommit?: string;
}

export interface WatcherConfig {
  enabled: boolean;
  watchIntervalMs: number;
  gitTimeoutMs: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  version: string;
  dataDir: string;
  anthropic?: AnthropicConfig;
  maxContextTokens?: number;
  autoSave?: boolean;
  autoLoad?: boolean;
  scorer?: ScorerConfig;
}

export interface AnthropicConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature?: number;
}

export interface ScorerConfig {
  weights: ScoringWeights;
  minRelevanceScore: number;
}

export interface ScoringWeights {
  recency: number;
  branchMatch: number;
  fileOverlap: number;
  keywordSimilarity: number;
}

// ============================================================================
// CLI Command Types
// ============================================================================

export interface SaveOptions {
  stdin?: boolean;
  auto?: boolean;
  output?: string;
  project?: string;
  branch?: string;
}

export interface LoadOptions {
  inject?: boolean;
  sessionId?: string;
  format?: 'raw' | 'preamble' | 'json';
}

export interface SearchOptions {
  query: string;
  limit?: number;
  project?: string;
  branch?: string;
}

export interface ListOptions {
  project?: string;
  branch?: string;
  limit?: number;
  format?: 'table' | 'json';
}

export interface ClearOptions {
  confirm?: boolean;
  all?: boolean;
  sessionId?: string;
}

export interface InitOptions {
  force?: boolean;
  skipHooks?: boolean;
}

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPSaveContextParams {
  projectName: string;
  branch: string;
  summary: string;
  metadata?: SessionMetadata;
}

export interface MCPLoadContextParams {
  projectName: string;
  branch: string;
  sessionId?: string;
}

export interface MCPListSessionsParams {
  projectName?: string;
  branch?: string;
  limit?: number;
}

export interface MCPSearchContextParams {
  query: string;
  projectName?: string;
  branch?: string;
  limit?: number;
}

export interface MCPStatusParams {
  projectName?: string;
  branch?: string;
}

// ============================================================================
// Scoring/Intelligence Types
// ============================================================================

export interface ScoredSession {
  session: Session;
  score: number;
  reasons: string[];
}

export interface RelevanceFactors {
  recencyScore: number;
  branchMatchScore: number;
  fileOverlapScore: number;
  keywordScore: number;
}

export interface SearchIndex {
  version: number;
  lastUpdated: number;
  entries: IndexEntry[];
}

export interface IndexEntry {
  sessionId: string;
  keywords: string[];
  filePaths: string[];
  projectName: string;
  branch: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class ContextCarryError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ContextCarryError';
  }
}

export enum ErrorCode {
  // Storage errors
  STORAGE_WRITE_FAILED = 'STORAGE_WRITE_FAILED',
  STORAGE_READ_FAILED = 'STORAGE_READ_FAILED',
  STORAGE_DELETE_FAILED = 'STORAGE_DELETE_FAILED',
  STORAGE_DIR_NOT_FOUND = 'STORAGE_DIR_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // Git/project errors
  GIT_NOT_FOUND = 'GIT_NOT_FOUND',
  GIT_COMMAND_FAILED = 'GIT_COMMAND_FAILED',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  BRANCH_NOT_FOUND = 'BRANCH_NOT_FOUND',

  // API errors
  API_ERROR = 'API_ERROR',
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_RATE_LIMITED = 'API_RATE_LIMITED',

  // Config errors
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_MISSING = 'CONFIG_MISSING',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',

  // MCP errors
  MCP_NOT_INITIALIZED = 'MCP_NOT_INITIALIZED',
  MCP_TOOL_FAILED = 'MCP_TOOL_FAILED',
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type CommandResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type AsyncResult<T = void> = Promise<CommandResult<T>>;
