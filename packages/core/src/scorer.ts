/**
 * Scorer Module - Rank sessions by relevance to current context
 *
 * Uses weighted scoring algorithm to determine which previous sessions
 * are most relevant to the current working context.
 */

import type {
  Session,
  ScoredSession,
  RelevanceFactors,
  ScoringWeights,
  ProjectInfo,
} from 'contextcarry-types';

/**
 * Scoring context - information about the current state
 */
export interface ScoringContext {
  projectInfo: ProjectInfo;
  currentKeywords?: string[];
  currentFilePaths?: string[];
  currentQuery?: string;
  maxRecencyHours?: number;
}

/**
 * Default scoring weights
 */
const DEFAULT_WEIGHTS: ScoringWeights = {
  recency: 0.3,
  branchMatch: 0.35,
  fileOverlap: 0.2,
  keywordSimilarity: 0.15,
};

/**
 * Score multiple sessions against the current context
 * Returns sessions sorted by relevance (highest first)
 */
export function scoreSessions(
  sessions: Session[],
  context: ScoringContext,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoredSession[] {
  if (!sessions || sessions.length === 0) {
    return [];
  }

  const scoredSessions: ScoredSession[] = sessions.map(session => {
    const factors = calculateRelevance(session, context, weights);
    const score = calculateFinalScore(factors, weights);
    const reasons = generateReasons(factors, session, context);

    return {
      session,
      score,
      reasons,
    };
  });

  // Sort by score (highest first)
  return scoredSessions.sort((a, b) => b.score - a.score);
}

/**
 * Calculate individual relevance factors for a session
 */
export function calculateRelevance(
  session: Session,
  context: ScoringContext,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): RelevanceFactors {
  const factors: RelevanceFactors = {
    recencyScore: calculateRecencyScore(session, context.maxRecencyHours),
    branchMatchScore: calculateBranchMatchScore(session, context.projectInfo),
    fileOverlapScore: calculateFileOverlapScore(session, context.currentFilePaths),
    keywordScore: calculateKeywordScore(session, context.currentKeywords, context.currentQuery),
  };

  return factors;
}

/**
 * Calculate recency score (0-1)
 * More recent sessions get higher scores
 */
function calculateRecencyScore(
  session: Session,
  maxHours: number = 24
): number {
  const now = Date.now();
  const ageMs = now - session.timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 1) return 1.0;
  if (ageHours >= maxHours) return 0.1;

  // Linear decay from 1.0 to 0.1 over the maxHours period
  return 1.0 - ((ageHours - 1) / (maxHours - 1)) * 0.9;
}

/**
 * Calculate branch match score (0-1)
 * Sessions on the same branch get highest scores
 */
function calculateBranchMatchScore(
  session: Session,
  projectInfo: ProjectInfo
): number {
  // Different project - no match
  if (session.projectName !== projectInfo.name) {
    return 0.0;
  }

  // Same branch - perfect match
  if (session.branch === projectInfo.branch) {
    return 1.0;
  }

  // Same project but different branch - partial match
  return 0.3;
}

/**
 * Calculate file overlap score (0-1)
 * Higher score if session worked on similar files
 */
function calculateFileOverlapScore(
  session: Session,
  currentFiles?: string[]
): number {
  if (!currentFiles || currentFiles.length === 0 || !session.filePaths || session.filePaths.length === 0) {
    return 0.0;
  }

  // Count overlapping files (considering partial paths)
  let overlapCount = 0;
  const checkedFiles = new Set<string>();

  for (const sessionFile of session.filePaths) {
    const sessionFileName = getFileName(sessionFile);
    if (checkedFiles.has(sessionFileName)) continue;

    for (const currentFile of currentFiles) {
      const currentFileName = getFileName(currentFile);
      if (sessionFileName === currentFileName) {
        overlapCount++;
        checkedFiles.add(sessionFileName);
        break;
      }
    }
  }

  // Calculate overlap ratio
  const maxOverlap = Math.max(session.filePaths.length, currentFiles.length);
  if (maxOverlap === 0) return 0.0;

  return overlapCount / maxOverlap;
}

/**
 * Calculate keyword similarity score (0-1)
 * Higher score if session has similar keywords
 */
function calculateKeywordScore(
  session: Session,
  currentKeywords?: string[],
  query?: string
): number {
  let keywordsToMatch: string[] = [];

  // Add provided keywords
  if (currentKeywords && currentKeywords.length > 0) {
    keywordsToMatch.push(...currentKeywords);
  }

  // Extract keywords from query if provided
  if (query) {
    const queryKeywords = extractKeywordsFromText(query);
    keywordsToMatch.push(...queryKeywords);
  }

  if (keywordsToMatch.length === 0 || !session.keywords || session.keywords.length === 0) {
    return 0.0;
  }

  // Count matching keywords
  let matchCount = 0;
  const matchedKeywords = new Set<string>();

  for (const keywordToMatch of keywordsToMatch) {
    const normalizedKeyword = keywordToMatch.toLowerCase().trim();
    if (matchedKeywords.has(normalizedKeyword)) continue;

    for (const sessionKeyword of session.keywords) {
      const normalizedSessionKeyword = sessionKeyword.toLowerCase().trim();
      if (normalizedKeyword === normalizedSessionKeyword ||
          normalizedSessionKeyword.includes(normalizedKeyword) ||
          normalizedKeyword.includes(normalizedSessionKeyword)) {
        matchCount++;
        matchedKeywords.add(normalizedKeyword);
        break;
      }
    }
  }

  // Calculate match ratio
  return matchCount / keywordsToMatch.length;
}

/**
 * Calculate final weighted score (0-100)
 */
function calculateFinalScore(
  factors: RelevanceFactors,
  weights: ScoringWeights
): number {
  const totalWeight = weights.recency + weights.branchMatch + weights.fileOverlap + weights.keywordSimilarity;

  const weightedSum =
    (factors.recencyScore * weights.recency) +
    (factors.branchMatchScore * weights.branchMatch) +
    (factors.fileOverlapScore * weights.fileOverlap) +
    (factors.keywordScore * weights.keywordSimilarity);

  return Math.round((weightedSum / totalWeight) * 100);
}

/**
 * Generate human-readable reasons for the score
 */
function generateReasons(
  factors: RelevanceFactors,
  session: Session,
  context: ScoringContext
): string[] {
  const reasons: string[] = [];

  if (factors.recencyScore > 0.7) {
    const ageHours = Math.round((Date.now() - session.timestamp) / (1000 * 60 * 60));
    reasons.push(`Recent session (${ageHours} hours ago)`);
  }

  if (factors.branchMatchScore === 1.0) {
    reasons.push(`Same branch (${session.branch})`);
  } else if (factors.branchMatchScore > 0) {
    reasons.push(`Same project (${session.projectName})`);
  }

  if (factors.fileOverlapScore > 0.5) {
    reasons.push('Similar files worked on');
  } else if (factors.fileOverlapScore > 0.2) {
    reasons.push('Some file overlap');
  }

  if (factors.keywordScore > 0.6) {
    reasons.push('High keyword relevance');
  } else if (factors.keywordScore > 0.3) {
    reasons.push('Some keyword matches');
  }

  return reasons.length > 0 ? reasons : ['Basic relevance'];
}

/**
 * Get file name from path
 */
function getFileName(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

/**
 * Extract keywords from text
 * Simple keyword extraction using common word filtering
 */
function extractKeywordsFromText(text: string): string[] {
  // Remove common words and punctuation, split into keywords
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'shall', 'can',
    'need', 'dare', 'ought', 'used', 'get', 'got', 'make', 'made', 'go',
    'went', 'gone', 'come', 'came', 'take', 'took', 'taken', 'see', 'saw',
    'seen', 'know', 'knew', 'known', 'think', 'thought', 'want', 'wanted',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
    'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
    'hers', 'ours', 'theirs', 'this', 'that', 'these', 'those', 'here', 'there',
    'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));

  return words;
}

/**
 * Find the most relevant session for the current context
 */
export function findMostRelevantSession(
  sessions: Session[],
  context: ScoringContext,
  weights?: ScoringWeights
): ScoredSession | null {
  const scoredSessions = scoreSessions(sessions, context, weights);
  return scoredSessions.length > 0 ? (scoredSessions[0] ?? null) : null;
}

/**
 * Filter sessions by minimum relevance score
 */
export function filterByMinScore(
  sessions: Session[],
  context: ScoringContext,
  minScore: number,
  weights?: ScoringWeights
): ScoredSession[] {
  const scoredSessions = scoreSessions(sessions, context, weights);
  return scoredSessions.filter(scoredSession => scoredSession.score >= minScore);
}

/**
 * Get top N sessions by relevance
 */
export function getTopNSessions(
  sessions: Session[],
  context: ScoringContext,
  n: number,
  weights?: ScoringWeights
): ScoredSession[] {
  const scoredSessions = scoreSessions(sessions, context, weights);
  return scoredSessions.slice(0, n);
}
