import type { Submission } from '@/lib/jutge_api_client'
import { parseSubmissionTime } from "./period"

/** Maximum gap between submissions before starting a new working session. */
export const IDLE_THRESHOLD_MS = 60 * 60 * 1000
/** Time credited at the start of each session (reading, thinking, first draft). */
export const SETUP_TIME_MS = 15 * 60 * 1000
/** Extra time when switching problems within the same session. */
export const CONTEXT_SWITCH_PENALTY_MS = 5 * 60 * 1000
/** After an AC, gaps longer than this likely mean a break rather than continued work. */
export const AC_FOLLOWUP_BREAK_MS = 30 * 60 * 1000

type TimestampedSubmission = {
  timeMs: number
  problemId: string
  veredict: string | null
}

function parseTimestampedSubmission(
  submission: Submission,
): TimestampedSubmission | null {
  try {
    const timeMs = parseSubmissionTime(submission.time_in).getTime()
    if (!Number.isFinite(timeMs)) return null
    return {
      timeMs,
      problemId: submission.problem_id,
      veredict: submission.veredict ?? null,
    }
  } catch {
    return null
  }
}

function isAcceptedVerdict(veredict: string | null): boolean {
  return veredict === "AC"
}

function isSessionBreak(gapMs: number, prevVeredict: string | null): boolean {
  if (gapMs > IDLE_THRESHOLD_MS) return true
  if (isAcceptedVerdict(prevVeredict) && gapMs > AC_FOLLOWUP_BREAK_MS) {
    return true
  }
  return false
}

/**
 * Estimates total active coding time by sessionizing submission timestamps.
 *
 * Core sessionization:
 * - Each session starts with setup time.
 * - Gaps within the idle threshold extend the current session.
 * - Larger gaps start a new session (setup time only, gap is not counted).
 *
 * Refinements:
 * - Problem changes within a session add a context-switch penalty.
 * - After an accepted submission, shorter gaps are treated as breaks because
 *   the user likely moved on rather than kept debugging.
 */
export function estimateActiveMinutes(
  submissions: Submission[] | undefined,
): number | null {
  if (!submissions?.length) return null

  const ordered = submissions
    .map(parseTimestampedSubmission)
    .filter((value): value is TimestampedSubmission => value !== null)
    .sort((a, b) => a.timeMs - b.timeMs)

  if (ordered.length === 0) return null

  let totalMs = SETUP_TIME_MS

  for (let index = 1; index < ordered.length; index++) {
    const prev = ordered[index - 1]!
    const current = ordered[index]!
    const gapMs = current.timeMs - prev.timeMs
    if (gapMs <= 0) continue

    if (isSessionBreak(gapMs, prev.veredict)) {
      totalMs += SETUP_TIME_MS
      continue
    }

    totalMs += gapMs
    if (prev.problemId !== current.problemId) {
      totalMs += CONTEXT_SWITCH_PENALTY_MS
    }
  }

  return Math.round(totalMs / 60_000)
}
