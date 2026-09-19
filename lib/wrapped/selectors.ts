import type {
  AllTables,
  Award,
  ColorMapping,
  Dashboard,
  HeatmapCalendar,
  HomepageStats,
  Submission,
} from '@/lib/jutge_api_client'
import { compilerColor } from './colors'
import { jutgeAwardIconUrl, resolveAwardYoutube } from './jutgeLinks'
import {
    formatDays,
    formatHours,
    formatMinutes,
    formatSubmissions,
    t,
} from './strings'
import { resolveProblemTitle } from "./problemTitles"
import {
  awardInPeriod,
  formatActivitySpan,
  formatPeriodLabel,
  isAllTimePeriod,
  parseSubmissionTime,
  submissionInPeriod,
  utcDayTsFromIso,
} from "./period"
import type { WrappedPeriod } from './period'
import { estimateActiveMinutes } from './timeSpent'
import type {
  AwardInsights,
  AwardItem,
  ChronoArchetypeKey,
  ChronoInsights,
  RhythmTitleKey,
  CourseArcInsights,
  DistributionItem,
  HeatmapInsights,
  HeatmapYearBlock,
  HeroMomentInsight,
  HeroMomentKind,
  IntroMetricDrilldowns,
  IntroProblemAward,
  IntroProblemItem,
  IntroSubmissionItem,
  JourneyInsights,
  PersonalizedInsights,
  RankInsights,
  RankingHighlight,
  RankingHighlightKind,
  RankingHighlights,
  SlowSolveInsight,
  VerdictInsights,
  WeekdayInsights,
  WrappedInsights,
  WrappedRawData,
} from "./types"

const DAY_SECONDS = 86_400

/** Beyond this span, stack one GitHub-style grid per calendar year. */
export const MULTI_YEAR_THRESHOLD_WEEKS = 54
const COURSE_COMPILERS = new Set(["P1++", "PRO2", "MakePRO2"])

export const WEEKDAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

function weekdayLabel(key: string): string {
  return t(`weekdays.${key}`, { defaultValue: key })
}

function heatmapTimestampToMs(ts: number): number {
  return ts > 1e12 ? ts : ts * 1000
}

function formatDate(ts: number): string {
  const d = new Date(heatmapTimestampToMs(ts))
  const day = String(d.getUTCDate()).padStart(2, "0")
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

function labelForKey(key: string, tables?: AllTables): string {
  if (tables?.compilers[key]) return tables.compilers[key].name
  if (tables?.verdicts[key]) return tables.verdicts[key].name
  if (tables?.proglangs[key]) return key
  return key.replace(/_/g, " ")
}

function colorForKey(
  key: string,
  hexColors: ColorMapping,
  category: "verdicts" | "compilers" | "proglangs",
): string | undefined {
  return hexColors[category]?.[key]
}

export function distributionToItems(
  dist: Record<string, number>,
  tables: AllTables | undefined,
  hexColors: ColorMapping,
  category: "verdicts" | "compilers" | "proglangs",
): DistributionItem[] {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  return Object.entries(dist)
    .map(([key, count]) => {
      const apiColor = colorForKey(key, hexColors, category)
      return {
        key,
        label: labelForKey(key, tables),
        count,
        percent: Math.round((count / total) * 1000) / 10,
        color:
          category === "compilers" ? compilerColor(key, apiColor) : apiColor,
        emoji: tables?.verdicts[key]?.emoji,
        description: tables?.verdicts[key]?.description,
      }
    })
    .sort((a, b) => b.count - a.count)
}

function formatMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month, 1))
  const mon = d.toLocaleDateString("en-US", { month: "short" })
  const yr = String(year).slice(-2)
  return `${mon} '${yr}`
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

function heatmapSpanWeeks(heatmap: HeatmapCalendar): number {
  if (heatmap.length === 0) return 0
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  const minTs = sorted[0]!.date
  const maxTs = sorted[sorted.length - 1]!.date
  return Math.floor((maxTs - minTs) / (7 * DAY_SECONDS)) + 1
}

function buildWeekMonthLabels(
  minTs: number,
  weekCount: number,
): (string | null)[] {
  const labels: (string | null)[] = []
  let prevMonth: number | null = null
  for (let w = 0; w < weekCount; w++) {
    const weekStartTs = minTs + w * 7 * DAY_SECONDS
    const d = new Date(heatmapTimestampToMs(weekStartTs))
    const month = d.getUTCMonth()
    if (month !== prevMonth) {
      labels.push(d.toLocaleDateString("en-US", { month: "long" }))
      prevMonth = month
    } else {
      labels.push(null)
    }
  }
  return labels
}

function utcDayTs(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month, day) / 1000)
}

function mondayBasedDow(ts: number): number {
  return (new Date(heatmapTimestampToMs(ts)).getUTCDay() + 6) % 7
}

function buildPeakMonth(
  heatmap: HeatmapCalendar,
): HeatmapInsights["peakMonth"] {
  if (heatmap.length === 0) return null

  const valueByMonth = new Map<string, number>()
  for (const c of heatmap) {
    const d = new Date(heatmapTimestampToMs(c.date))
    const key = monthKey(d.getUTCFullYear(), d.getUTCMonth())
    valueByMonth.set(key, (valueByMonth.get(key) ?? 0) + c.value)
  }

  let peakMonth: HeatmapInsights["peakMonth"] = null
  for (const [key, total] of valueByMonth) {
    if (total <= 0) continue
    if (!peakMonth || total > peakMonth.total) {
      const [yearStr, monthStr] = key.split("-")
      const year = Number(yearStr)
      const month = Number(monthStr)
      peakMonth = { monthLabel: formatMonthLabel(year, month), total }
    }
  }
  return peakMonth
}

function buildCalendarGridForRange(
  valueByDay: Map<number, number>,
  minTs: number,
  maxTs: number,
): Omit<HeatmapYearBlock, "year"> {
  const weekCount = Math.floor((maxTs - minTs) / (7 * DAY_SECONDS)) + 1
  const grid: number[][] = Array.from({ length: 7 }, () =>
    Array(weekCount).fill(0),
  )
  const labels: (string | null)[][] = Array.from({ length: 7 }, () =>
    Array(weekCount).fill(null),
  )
  let maxCellValue = 0

  for (let ts = minTs; ts <= maxTs; ts += DAY_SECONDS) {
    const weekIndex = Math.floor((ts - minTs) / (7 * DAY_SECONDS))
    const dow = mondayBasedDow(ts)
    const value = valueByDay.get(ts) ?? 0
    maxCellValue = Math.max(maxCellValue, value)
    grid[dow]![weekIndex] = value
    labels[dow]![weekIndex] = formatDate(ts)
  }

  return {
    grid,
    labels,
    monthLabels: buildWeekMonthLabels(minTs, weekCount),
    maxCellValue,
  }
}

function periodGridBounds(
  heatmap: HeatmapCalendar,
  period?: WrappedPeriod,
): { minTs: number; maxTs: number } | null {
  if (period && !isAllTimePeriod(period) && period.start && period.end) {
    return {
      minTs: utcDayTsFromIso(period.start),
      maxTs: utcDayTsFromIso(period.end),
    }
  }
  if (heatmap.length === 0) return null
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  return { minTs: sorted[0]!.date, maxTs: sorted[sorted.length - 1]!.date }
}

function gridSpanWeeks(minTs: number, maxTs: number): number {
  return Math.floor((maxTs - minTs) / (7 * DAY_SECONDS)) + 1
}

function buildYearBlocks(
  heatmap: HeatmapCalendar,
  period?: WrappedPeriod,
): HeatmapYearBlock[] {
  const bounds = periodGridBounds(heatmap, period)
  if (!bounds) return []

  const { minTs, maxTs } = bounds
  const valueByDay = new Map(heatmap.map((c) => [c.date, c.value]))
  const spanWeeks = gridSpanWeeks(minTs, maxTs)

  if (spanWeeks > MULTI_YEAR_THRESHOLD_WEEKS) {
    const minYear = new Date(heatmapTimestampToMs(minTs)).getUTCFullYear()
    const maxYear = new Date(heatmapTimestampToMs(maxTs)).getUTCFullYear()
    const blocks: HeatmapYearBlock[] = []
    for (let year = minYear; year <= maxYear; year++) {
      const rangeMin = Math.max(utcDayTs(year, 0, 1), minTs)
      const rangeMax = Math.min(utcDayTs(year, 11, 31), maxTs)
      if (rangeMin > rangeMax) continue
      blocks.push({
        year,
        ...buildCalendarGridForRange(valueByDay, rangeMin, rangeMax),
      })
    }
    return blocks
  }

  const year = new Date(heatmapTimestampToMs(minTs)).getUTCFullYear()
  return [{ year, ...buildCalendarGridForRange(valueByDay, minTs, maxTs) }]
}

export function buildHeatmapInsights(
  dashboard: Dashboard,
  period?: WrappedPeriod,
): HeatmapInsights {
  const activeDays = dashboard.heatmap.filter((c) => c.value > 0)
  const sorted = [...activeDays].sort((a, b) => a.date - b.date)

  let longestStreak = 0
  let current = 0
  let prevTs: number | null = null

  for (const day of sorted) {
    if (prevTs !== null && day.date === prevTs + DAY_SECONDS) current += 1
    else current = 1
    longestStreak = Math.max(longestStreak, current)
    prevTs = day.date
  }

  const peakCell = activeDays.reduce(
    (best, c) => (c.value > (best?.value ?? 0) ? c : best),
    null as (typeof activeDays)[0] | null,
  )

  const minTs = sorted[0]?.date ?? dashboard.heatmap[0]?.date ?? 0
  const weekTotals = new Map<number, number>()
  for (const c of dashboard.heatmap) {
    const weekIndex = Math.floor((c.date - minTs) / (7 * DAY_SECONDS))
    weekTotals.set(weekIndex, (weekTotals.get(weekIndex) ?? 0) + c.value)
  }

  let peakWeek: HeatmapInsights["peakWeek"] = null
  for (const [weekIndex, total] of weekTotals) {
    if (total <= 0) continue
    if (!peakWeek || total > peakWeek.total) {
      const weekStart = minTs + weekIndex * 7 * DAY_SECONDS
      const weekEnd = weekStart + 6 * DAY_SECONDS
      peakWeek = {
        weekLabel: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
        total,
      }
    }
  }

  const gridBounds = periodGridBounds(dashboard.heatmap, period)
  const spanWeeks = gridBounds
    ? gridSpanWeeks(gridBounds.minTs, gridBounds.maxTs)
    : heatmapSpanWeeks(dashboard.heatmap)
  const yearBlocks = buildYearBlocks(dashboard.heatmap, period)
  const calendarMode: HeatmapInsights["calendarMode"] =
    spanWeeks > MULTI_YEAR_THRESHOLD_WEEKS ? "multiYear" : "single"
  const totalSubmissions = dashboard.heatmap.reduce((s, c) => s + c.value, 0)
  const maxCellValue = Math.max(...dashboard.heatmap.map((c) => c.value), 0)

  return {
    calendarMode,
    longestStreak,
    peakDay: peakCell
      ? {
          date: formatDate(peakCell.date),
          count: peakCell.value,
          timestamp: peakCell.date,
        }
      : null,
    peakWeek,
    peakMonth: buildPeakMonth(dashboard.heatmap),
    totalActiveDays: activeDays.length,
    totalSubmissions,
    yearBlocks,
    maxCellValue,
  }
}

function submissionTimeMs(sub: Submission): number {
  return parseSubmissionTime(sub.time_in).getTime()
}

function isAcceptedVerdict(veredict: string | null): boolean {
  return veredict?.toUpperCase() === "AC"
}

const EMPTY_INTRO_DRILLDOWNS: IntroMetricDrilldowns = {
  available: false,
  acceptedProblems: [],
  rejectedProblems: [],
  submissions: [],
}

function formatSubmissionTime(timeIn: Submission["time_in"]): string {
  return parseSubmissionTime(timeIn).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function verdictLabel(
  veredict: string | null,
  tables: AllTables | undefined,
): string {
  if (!veredict) return t("slides.intro.drilldown.unknownVerdict")
  return tables?.verdicts?.[veredict]?.name ?? veredict
}

function toIntroProblemItem(
  problemId: string,
  problemTitles: Record<string, string> | undefined,
): IntroProblemItem {
  return {
    problemId,
    problemLabel: problemId,
    problemTitle: resolveProblemTitle(problemId, problemTitles),
  }
}

function buildAwardsByProblem(
  awards: Record<string, Award> | undefined,
  period: WrappedPeriod | undefined,
  acceptedProblemIds: Set<string>,
): Map<string, IntroProblemAward[]> {
  const byProblem = new Map<string, IntroProblemAward[]>()
  if (!awards || !period) return byProblem

  for (const award of Object.values(awards)) {
    if (!awardInPeriod(award, period)) continue
    const problemId = award.submission?.problem_id
    if (!problemId || !acceptedProblemIds.has(problemId)) continue

    const list = byProblem.get(problemId) ?? []
    list.push({
      awardId: award.award_id,
      title: award.title,
      iconUrl: jutgeAwardIconUrl(award.icon, award.type),
    })
    byProblem.set(problemId, list)
  }

  for (const [problemId, list] of byProblem) {
    byProblem.set(
      problemId,
      [...list].sort((a, b) => a.title.localeCompare(b.title)),
    )
  }

  return byProblem
}

function latestSubmissionForProblem(
  submissions: Submission[],
  problemId: string,
): Submission | null {
  let latest: Submission | null = null
  for (const sub of submissions) {
    if (sub.problem_id !== problemId) continue
    if (!latest || submissionTimeMs(sub) > submissionTimeMs(latest)) {
      latest = sub
    }
  }
  return latest
}

function firstAcceptedSubmission(submissions: Submission[]): Submission | null {
  let earliest: Submission | null = null
  for (const sub of submissions) {
    if (!isAcceptedVerdict(sub.veredict)) continue
    if (!earliest || submissionTimeMs(sub) < submissionTimeMs(earliest)) {
      earliest = sub
    }
  }
  return earliest
}

function attemptsBeforeFirstAc(submissions: Submission[]): number {
  const sorted = [...submissions].sort(
    (a, b) => submissionTimeMs(a) - submissionTimeMs(b),
  )
  const firstAcIdx = sorted.findIndex((sub) => isAcceptedVerdict(sub.veredict))
  return firstAcIdx >= 0 ? firstAcIdx : 0
}

export function buildIntroMetricDrilldowns(
  submissions: Submission[] | undefined,
  tables: AllTables | undefined,
  problemTitles?: Record<string, string>,
  awards?: Record<string, Award>,
  period?: WrappedPeriod,
): IntroMetricDrilldowns {
  if (!submissions?.length) return EMPTY_INTRO_DRILLDOWNS

  const problemsWithAc = new Set<string>()
  const problemsAttempted = new Set<string>()
  const submissionsByProblem = new Map<string, Submission[]>()

  for (const sub of submissions) {
    problemsAttempted.add(sub.problem_id)
    if (isAcceptedVerdict(sub.veredict)) {
      problemsWithAc.add(sub.problem_id)
    }
    const list = submissionsByProblem.get(sub.problem_id) ?? []
    list.push(sub)
    submissionsByProblem.set(sub.problem_id, list)
  }

  const awardsByProblem = buildAwardsByProblem(awards, period, problemsWithAc)

  const acceptedProblems = [...problemsWithAc]
    .sort((a, b) => a.localeCompare(b))
    .map((problemId) => {
      const item = toIntroProblemItem(problemId, problemTitles)
      const problemSubs = submissionsByProblem.get(problemId) ?? []
      const firstAc = firstAcceptedSubmission(problemSubs)
      const problemAwards = awardsByProblem.get(problemId)
      return {
        ...item,
        submissionCount: problemSubs.length,
        attemptsBeforeAc: attemptsBeforeFirstAc(problemSubs),
        acceptedAtLabel: firstAc
          ? formatSubmissionTime(firstAc.time_in)
          : null,
        ...(problemAwards?.length ? { awards: problemAwards } : {}),
      }
    })

  const rejectedProblems = [...problemsAttempted]
    .filter((problemId) => !problemsWithAc.has(problemId))
    .sort((a, b) => a.localeCompare(b))
    .map((problemId) => {
      const item = toIntroProblemItem(problemId, problemTitles)
      const problemSubs = submissionsByProblem.get(problemId) ?? []
      const latest = latestSubmissionForProblem(problemSubs, problemId)
      return {
        ...item,
        submissionCount: problemSubs.length,
        lastVerdictLabel: latest
          ? verdictLabel(latest.veredict, tables)
          : null,
      }
    })

  const submissionItems: IntroSubmissionItem[] = [...submissions]
    .sort((a, b) => submissionTimeMs(b) - submissionTimeMs(a))
    .map((sub) => ({
      submissionId: sub.submission_id,
      problemId: sub.problem_id,
      problemLabel: sub.problem_id,
      problemTitle: resolveProblemTitle(sub.problem_id, problemTitles),
      verdict: sub.veredict,
      verdictLabel: verdictLabel(sub.veredict, tables),
      timeLabel: formatSubmissionTime(sub.time_in),
      timeMs: submissionTimeMs(sub),
    }))

  return {
    available: true,
    acceptedProblems,
    rejectedProblems,
    submissions: submissionItems,
  }
}

export function buildJourneyInsights(
  dashboard: Dashboard,
  drilldowns: IntroMetricDrilldowns = EMPTY_INTRO_DRILLDOWNS,
  estimatedActiveMinutes: number | null = null,
): JourneyInsights {
  const { stats, heatmap } = dashboard
  const sorted = [...heatmap].sort((a, b) => a.date - b.date)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const accepted = stats.number_of_accepted_problems ?? 0
  const rejected = stats.number_of_rejected_problems ?? 0
  const denom = accepted + rejected || 1

  return {
    acceptedProblems: accepted,
    rejectedProblems: rejected,
    totalSubmissions: stats.number_of_submissions ?? 0,
    problemSuccessRate: Math.round((accepted / denom) * 1000) / 10,
    estimatedActiveMinutes,
    firstActive: first ? formatDate(first.date) : null,
    lastActive: last ? formatDate(last.date) : null,
    spanLabel:
      first && last
        ? `${formatDate(first.date)} – ${formatDate(last.date)}`
        : t("period.allTime"),
    drilldowns,
  }
}

const WEEKEND_DAY_KEYS = new Set(["saturday", "sunday"])

/** Picks a playful rhythm-slide title from weekday patterns, then falls back to chrono archetype. */
export function resolveRhythmTitleKey(
  weekday: WeekdayInsights,
  chrono: ChronoInsights,
): RhythmTitleKey {
  const total = weekday.weekdays.reduce((sum, day) => sum + day.count, 0) || 1
  const weekendCount = weekday.weekdays
    .filter((day) => WEEKEND_DAY_KEYS.has(day.key))
    .reduce((sum, day) => sum + day.count, 0)
  const weekendShare = weekendCount / total
  const peak = weekday.peak

  if (weekendShare >= 0.4) return "weekendWarrior"
  if (peak?.key === "sunday" && (peak.percent >= 18 || weekendShare >= 0.28)) {
    return "sundayScrambler"
  }
  if (
    peak?.key === "saturday" &&
    (peak.percent >= 18 || weekendShare >= 0.28)
  ) {
    return "saturdaySpecial"
  }
  if (peak?.key === "friday" && peak.percent >= 20) return "fridayFinisher"
  if (peak?.key === "monday" && peak.percent >= 20) return "mondayMenace"
  if (peak?.key === "wednesday" && peak.percent >= 22) return "midweekMachine"

  return chrono.archetypeKey
}

export function buildWeekdayInsights(dashboard: Dashboard): WeekdayInsights {
  const dist = dashboard.distributions.submissions_by_weekday
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const weekdays = WEEKDAY_ORDER.map((key) => ({
    key,
    label: weekdayLabel(key),
    count: dist[key] ?? 0,
    percent: Math.round(((dist[key] ?? 0) / total) * 1000) / 10,
  }))
  const byCount = [...weekdays].sort((a, b) => b.count - a.count)

  return {
    weekdays,
    peak: byCount[0] ?? null,
    quietest: byCount[byCount.length - 1] ?? null,
  }
}

function countForHour(raw: Record<string, number>, hour: number): number {
  const padded = String(hour).padStart(2, "0")
  return raw[padded] ?? raw[String(hour)] ?? raw[`${hour}:00`] ?? 0
}

export function buildChronoInsights(dashboard: Dashboard): ChronoInsights {
  const raw = dashboard.distributions.submissions_by_hour
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: countForHour(raw, hour),
  }))

  const nightSubmissions = hours
    .filter((h) => h.hour >= 0 && h.hour <= 4)
    .reduce((s, h) => s + h.count, 0)

  const morning = hours
    .filter((h) => h.hour >= 5 && h.hour < 12)
    .reduce((s, h) => s + h.count, 0)
  const afternoon = hours
    .filter((h) => h.hour >= 12 && h.hour < 18)
    .reduce((s, h) => s + h.count, 0)
  const evening = hours
    .filter((h) => h.hour >= 18 && h.hour <= 23)
    .reduce((s, h) => s + h.count, 0)

  let archetypeKey: ChronoArchetypeKey = "balancedGrinder"
  const maxBucket = Math.max(morning, afternoon, evening, nightSubmissions)
  if (nightSubmissions === maxBucket && nightSubmissions > 50)
    archetypeKey = "nightOwl"
  else if (morning === maxBucket) archetypeKey = "earlyRiser"
  else if (evening === maxBucket) archetypeKey = "eveningCoder"
  else if (afternoon === maxBucket) archetypeKey = "afternoonOperator"
  const archetype = t(`chrono.archetypes.${archetypeKey}`)

  const peak = hours.reduce((best, h) => (h.count > best.count ? h : best), {
    hour: 0,
    count: 0,
  })

  const subsTotal = dashboard.stats.number_of_submissions || 1
  const narrative =
    nightSubmissions < subsTotal * 0.05
      ? t("chrono.narrativePeak", {
          hour: String(peak.hour).padStart(2, "0"),
          archetype: archetype.toLowerCase(),
        })
      : t("chrono.narrativeNight", { count: nightSubmissions })

  return {
    archetypeKey,
    archetype,
    nightSubmissions,
    peakHour: peak.hour,
    peakHourCount: peak.count,
    hours,
    narrative,
  }
}

export function buildCourseArcInsights(
  dashboard: Dashboard,
  tables: AllTables,
  hexColors: ColorMapping,
): CourseArcInsights {
  const compilers = distributionToItems(
    dashboard.distributions.compilers,
    tables,
    hexColors,
    "compilers",
  )
  const proglangs = distributionToItems(
    dashboard.distributions.proglangs,
    tables,
    hexColors,
    "proglangs",
  )

  const total = compilers.reduce((s, c) => s + c.count, 0) || 1
  const courseCompilerCount = compilers
    .filter((c) => COURSE_COMPILERS.has(c.key))
    .reduce((s, c) => s + c.count, 0)

  const otherLanguages = proglangs
    .filter((p) => p.key !== proglangs[0]?.key)
    .slice(0, 3)
  const courseCompilerShare =
    Math.round((courseCompilerCount / total) * 1000) / 10
  const topProglang = proglangs[0] ?? null
  const topCompiler = compilers[0] ?? null

  const { title, subtitle } = buildCourseArcCopy(
    courseCompilerShare,
    topProglang,
  )

  return {
    courseCompilerShare,
    courseCompilerCount,
    topProglang,
    topCompiler,
    otherLanguages,
    title,
    subtitle,
  }
}

function buildCourseArcCopy(
  courseShare: number,
  topProglang: DistributionItem | null,
): { title: string; subtitle: string } {
  const lang = topProglang?.label ?? t("courseArc.fallbackLang")
  const subtitle = t("courseArc.mainLanguageSub", { lang })

  if (courseShare >= 50) {
    return {
      title: t("courseArc.mostlyCoursework"),
      subtitle,
    }
  }

  return {
    title: t("courseArc.compilerMix"),
    subtitle,
  }
}

function buildVerdictNarrative(
  ac: number,
  wa: number,
  ce: number,
  ee: number,
  sc: number,
  pe: number,
  total: number,
): string {
  const friction = [
    { key: "WA", count: wa, label: t("verdicts.wrongAnswers") },
    { key: "CE", count: ce, label: t("verdicts.compilationErrors") },
    { key: "EE", count: ee, label: t("verdicts.executionErrors") },
    { key: "SC", count: sc, label: t("verdicts.scoredAttempts") },
    { key: "PE", count: pe, label: t("verdicts.presentationErrors") },
  ].sort((a, b) => b.count - a.count)

  const top = friction[0]
  if (!top || top.count === 0) {
    return t("verdicts.narrativeClean", { ac, total })
  }
  return t("verdicts.narrativeFriction", {
    total,
    ac,
    count: top.count,
    label: top.label,
  })
}

export function buildVerdictInsights(
  dashboard: Dashboard,
  tables: AllTables,
  hexColors: ColorMapping,
): VerdictInsights {
  const dist = dashboard.distributions.verdicts
  const items = distributionToItems(dist, tables, hexColors, "verdicts")

  const ac = dist.AC ?? 0
  const pe = dist.PE ?? 0
  const wa = dist.WA ?? 0
  const ce = dist.CE ?? 0
  const ee = dist.EE ?? 0
  const sc = dist.SC ?? 0
  const known = ac + pe + wa + ce + ee + sc
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  const other = total - known

  return {
    ac,
    pe,
    wa,
    ce,
    ee,
    sc,
    other,
    total,
    acRate: Math.round((ac / total) * 1000) / 10,
    narrative: buildVerdictNarrative(ac, wa, ce, ee, sc, pe, total),
    items,
  }
}

function buildHeroMoment(
  submissions: Submission[] | undefined,
  period: WrappedPeriod,
): HeroMomentInsight | null {
  if (!submissions?.length) return null

  const filtered = isAllTimePeriod(period)
    ? submissions
    : submissions.filter((s) => submissionInPeriod(s, period))
  if (filtered.length === 0) return null

  const byProblem = new Map<string, Submission[]>()
  for (const sub of filtered) {
    const list = byProblem.get(sub.problem_id) ?? []
    list.push(sub)
    byProblem.set(sub.problem_id, list)
  }

  let mostAttempted: { problemId: string; total: number } | null = null
  let bestGrind: {
    problemId: string
    total: number
    attemptsBeforeAc: number
  } | null = null
  let firstAc: { problemId: string; timeMs: number } | null = null

  for (const [problemId, subs] of byProblem) {
    const sorted = [...subs].sort(
      (a, b) => submissionTimeMs(a) - submissionTimeMs(b),
    )
    const total = sorted.length
    if (!mostAttempted || total > mostAttempted.total) {
      mostAttempted = { problemId, total }
    }

    const firstAcIdx = sorted.findIndex((s) => isAcceptedVerdict(s.veredict))
    if (firstAcIdx >= 0) {
      const attemptsBeforeAc = firstAcIdx
      if (
        attemptsBeforeAc >= 2 &&
        (!bestGrind || attemptsBeforeAc > bestGrind.attemptsBeforeAc)
      ) {
        bestGrind = { problemId, total, attemptsBeforeAc }
      }
      const acTime = submissionTimeMs(sorted[firstAcIdx]!)
      if (!firstAc || acTime < firstAc.timeMs) {
        firstAc = { problemId, timeMs: acTime }
      }
    }
  }

  let pick: {
    kind: HeroMomentKind
    problemId: string
    submissionCount: number
    attemptsBeforeAc: number | null
  } | null = null

  if (bestGrind) {
    pick = {
      kind: "grind",
      problemId: bestGrind.problemId,
      submissionCount: bestGrind.total,
      attemptsBeforeAc: bestGrind.attemptsBeforeAc,
    }
  } else if (mostAttempted && mostAttempted.total >= 2) {
    pick = {
      kind: "most_attempted",
      problemId: mostAttempted.problemId,
      submissionCount: mostAttempted.total,
      attemptsBeforeAc: null,
    }
  } else if (firstAc) {
    pick = {
      kind: "first_ac",
      problemId: firstAc.problemId,
      submissionCount: byProblem.get(firstAc.problemId)?.length ?? 1,
      attemptsBeforeAc: null,
    }
  }

  if (!pick) return null

  const problemLabel = pick.problemId
  const subsWord = formatSubmissions(pick.submissionCount)

  if (pick.kind === "grind" && pick.attemptsBeforeAc !== null) {
    return {
      kind: pick.kind,
      problemId: pick.problemId,
      problemLabel,
      submissionCount: pick.submissionCount,
      attemptsBeforeAc: pick.attemptsBeforeAc,
      detail: t("personalization.hero.grindDetail", {
        attempts: pick.attemptsBeforeAc,
        total: pick.submissionCount,
        submissions: subsWord,
      }),
    }
  }

  if (pick.kind === "most_attempted") {
    return {
      kind: pick.kind,
      problemId: pick.problemId,
      problemLabel,
      submissionCount: pick.submissionCount,
      attemptsBeforeAc: null,
      detail: t("personalization.hero.mostAttemptedDetail", {
        submissions: subsWord,
      }),
    }
  }

  return {
    kind: "first_ac",
    problemId: pick.problemId,
    problemLabel,
    submissionCount: pick.submissionCount,
    attemptsBeforeAc: null,
    detail: t("personalization.hero.firstAcDetail", {
      submissions: subsWord,
    }),
  }
}

function formatSolveDuration(durationMs: number): string {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60_000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []

  if (days > 0) parts.push(formatDays(days))
  if (hours > 0 && parts.length < 2) parts.push(formatHours(hours))
  if ((minutes > 0 || parts.length === 0) && parts.length < 2) {
    parts.push(formatMinutes(minutes))
  }

  return parts.join(", ")
}

function buildSlowSolveInsight(
  submissions: Submission[] | undefined,
  period: WrappedPeriod,
  problemTitles?: Record<string, string>,
): SlowSolveInsight | null {
  if (!submissions?.length) return null

  const filtered = isAllTimePeriod(period)
    ? submissions
    : submissions.filter((s) => submissionInPeriod(s, period))
  if (filtered.length === 0) return null

  const byProblem = new Map<string, Submission[]>()
  for (const sub of filtered) {
    const list = byProblem.get(sub.problem_id) ?? []
    list.push(sub)
    byProblem.set(sub.problem_id, list)
  }

  let slowest: {
    problemId: string
    durationMs: number
    submissionsBeforeAc: number
  } | null = null

  for (const [problemId, subs] of byProblem) {
    const sorted = [...subs].sort(
      (a, b) => submissionTimeMs(a) - submissionTimeMs(b),
    )
    const first = sorted[0]
    if (!first || isAcceptedVerdict(first.veredict)) continue

    const firstAcIdx = sorted.findIndex((sub) =>
      isAcceptedVerdict(sub.veredict),
    )
    if (firstAcIdx <= 0) continue

    const durationMs =
      submissionTimeMs(sorted[firstAcIdx]!) - submissionTimeMs(first)
    const submissionsBeforeAc = firstAcIdx

    if (
      !slowest ||
      durationMs > slowest.durationMs ||
      (durationMs === slowest.durationMs &&
        submissionsBeforeAc > slowest.submissionsBeforeAc)
    ) {
      slowest = { problemId, durationMs, submissionsBeforeAc }
    }
  }

  if (!slowest) return null

  const durationLabel = formatSolveDuration(slowest.durationMs)
  return {
    problemId: slowest.problemId,
    problemLabel:
      resolveProblemTitle(slowest.problemId, problemTitles) ??
      slowest.problemId,
    durationMs: slowest.durationMs,
    durationLabel,
    submissionsBeforeAc: slowest.submissionsBeforeAc,
    detail: t("personalization.slowSolve.detail", {
      duration: durationLabel,
    }),
  }
}

function formatSharePercent(
  numerator: number,
  denominator: number,
  decimalPlaces: number,
): number {
  if (denominator <= 0) return 0
  const factor = 10 ** decimalPlaces
  return Math.round((numerator / denominator) * 100 * factor) / factor
}

function computeFirstAttemptRate(
  submissions: Submission[] | undefined,
  period: WrappedPeriod,
): { solvedFirstAttempt: number; totalSolved: number; rate: number } | null {
  if (!submissions?.length) return null

  const filtered = isAllTimePeriod(period)
    ? submissions
    : submissions.filter((s) => submissionInPeriod(s, period))
  if (filtered.length === 0) return null

  const byProblem = new Map<string, Submission[]>()
  for (const sub of filtered) {
    const list = byProblem.get(sub.problem_id) ?? []
    list.push(sub)
    byProblem.set(sub.problem_id, list)
  }

  let solvedFirstAttempt = 0
  let totalSolved = 0

  for (const subs of byProblem.values()) {
    const sorted = [...subs].sort(
      (a, b) => submissionTimeMs(a) - submissionTimeMs(b),
    )
    const firstAcIdx = sorted.findIndex((s) => isAcceptedVerdict(s.veredict))
    if (firstAcIdx < 0) continue

    totalSolved++
    if (firstAcIdx === 0) solvedFirstAttempt++
  }

  if (totalSolved === 0) return null

  return {
    solvedFirstAttempt,
    totalSolved,
    rate: Math.round((solvedFirstAttempt / totalSolved) * 1000) / 10,
  }
}

const RANKING_HIGHLIGHT_ORDER = [
  "compile_grief",
  "platform_submissions",
  "first_attempt",
  "platform_problems",
] as const satisfies readonly RankingHighlightKind[]

export function buildRankingHighlights(raw: WrappedRawData): RankingHighlights {
  const { dashboard, homepageStats, period, submissions } = raw
  const acceptedProblems = dashboard.stats.number_of_accepted_problems ?? 0
  const userSubmissions = dashboard.stats.number_of_submissions ?? 0
  const platformProblems = homepageStats.problems ?? 0
  const platformSubmissions = homepageStats.submissions ?? 0

  const byKind = new Map<RankingHighlightKind, RankingHighlight>()

  const verdictDist = dashboard.distributions.verdicts
  const compileErrors = verdictDist.CE ?? 0
  const judgedTotal =
    Object.values(verdictDist).reduce((sum, count) => sum + count, 0) ||
    userSubmissions
  if (compileErrors > 0 && judgedTotal > 0) {
    byKind.set("compile_grief", {
      kind: "compile_grief",
      percent: Math.round((compileErrors / judgedTotal) * 1000) / 10,
      numerator: compileErrors,
      denominator: judgedTotal,
    })
  }

  if (platformSubmissions > 0 && userSubmissions > 0) {
    byKind.set("platform_submissions", {
      kind: "platform_submissions",
      percent: formatSharePercent(userSubmissions, platformSubmissions, 4),
      numerator: userSubmissions,
      denominator: platformSubmissions,
    })
  }

  const firstAttempt = computeFirstAttemptRate(submissions, period)
  if (firstAttempt) {
    byKind.set("first_attempt", {
      kind: "first_attempt",
      percent: firstAttempt.rate,
      numerator: firstAttempt.solvedFirstAttempt,
      denominator: firstAttempt.totalSolved,
    })
  }

  if (platformProblems > 0 && acceptedProblems > 0) {
    byKind.set("platform_problems", {
      kind: "platform_problems",
      percent: formatSharePercent(acceptedProblems, platformProblems, 3),
      numerator: acceptedProblems,
      denominator: platformProblems,
    })
  }

  const items = RANKING_HIGHLIGHT_ORDER.flatMap((kind) => {
    const item = byKind.get(kind)
    return item ? [item] : []
  })

  return { items }
}

function buildPersonalizedInsights(
  raw: WrappedRawData,
  journey: JourneyInsights,
  heatmap: HeatmapInsights,
  weekday: WeekdayInsights,
  chrono: ChronoInsights,
  rank: RankInsights,
): PersonalizedInsights {
  const periodLabel = formatPeriodLabel(raw.period)
  const peak = weekday.peak
  const quietest = weekday.quietest

  const introSubtitle = t("personalization.intro.subtitle", {
    period: periodLabel,
    rate: journey.problemSuccessRate,
  })

  const introActivity =
    isAllTimePeriod(raw.period)
      ? journey.firstActive && journey.lastActive
        ? t("personalization.intro.activity", {
            span: formatActivitySpan(raw.period, journey.spanLabel),
          })
        : null
      : raw.period.start && raw.period.end
        ? t("personalization.intro.activity", {
            span: formatActivitySpan(raw.period, journey.spanLabel),
          })
        : null

  let heatmapTitle = t("slides.heatmap.title")
  if (heatmap.longestStreak >= 7) {
    heatmapTitle = t("personalization.heatmap.titleStreak", {
      count: formatDays(heatmap.longestStreak),
    })
  } else if (heatmap.peakMonth) {
    heatmapTitle = t("personalization.heatmap.titlePeakMonth", {
      month: heatmap.peakMonth.monthLabel,
    })
  }

  const heatmapSubtitle = heatmap.peakDay
    ? t("slides.heatmap.peakDay", {
        period: periodLabel,
        count: formatSubmissions(heatmap.peakDay.count),
        date: heatmap.peakDay.date,
      })
    : t("slides.heatmap.summary", {
        period: periodLabel,
        submissions: formatSubmissions(heatmap.totalSubmissions),
        days: formatDays(heatmap.totalActiveDays),
      })

  const weekdayTitle = peak
    ? t("slides.weekday.judgmentDay", { day: peak.label })
    : t("slides.weekday.weeklyRhythm")

  const weekdaySubtitle =
    peak && quietest
      ? t("slides.weekday.subtitle", {
          peak: peak.label.toLowerCase(),
          quietest: quietest.label.toLowerCase(),
        })
      : undefined

  const chronoEyebrow = t("personalization.chrono.eyebrow", {
    period: periodLabel,
    archetype: chrono.archetype,
  })

  const rankingSubtitle = t("personalization.ranking.subtitle", {
    period: periodLabel,
    elite: rank.eliteLabel,
  })

  const usersAheadText =
    rank.usersAhead > 0
      ? t("personalization.ranking.usersAhead", {
          count: rank.usersAhead.toLocaleString("en-US"),
          total: rank.platformUserCount.toLocaleString("en-US"),
        })
      : null

  const heroMoment = buildHeroMoment(raw.submissions, raw.period)
  const slowSolve = buildSlowSolveInsight(
    raw.submissions,
    raw.period,
    raw.problemTitles,
  )

  return {
    introSubtitle,
    introActivity,
    heatmapTitle,
    heatmapSubtitle,
    weekdayTitle,
    weekdaySubtitle,
    chronoEyebrow,
    rhythmTitleKey: resolveRhythmTitleKey(weekday, chrono),
    rankingSubtitle,
    usersAheadText,
    heroMoment,
    slowSolve,
  }
}

export function buildRankInsights(
  rank: number,
  homepage: HomepageStats,
): RankInsights {
  const platformUserCount = homepage.users || 1
  const usersAhead = Math.max(0, rank - 1)
  const percentile =
    Math.round((1 - usersAhead / platformUserCount) * 1000) / 10
  const topPercent = Math.round((rank / platformUserCount) * 10000) / 100
  return {
    rank,
    platformUserCount,
    percentile,
    usersAhead,
    topPercent,
    eliteLabel: t("rank.eliteLabel", { percent: topPercent }),
  }
}

function formatAwardTime(time: Award["time"]): string {
  return parseSubmissionTime(time).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const EMPTY_AWARD_INSIGHTS: AwardInsights = {
  count: 0,
  items: [],
  featured: null,
  title: "",
}

function shuffleCopy<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function interleaveAwardPools(
  withYoutube: Award[],
  withoutYoutube: Award[],
  random: () => number,
): Award[] {
  const youtube = [...withYoutube]
  const plain = [...withoutYoutube]
  const result: Award[] = []

  while (youtube.length > 0 || plain.length > 0) {
    const pickYoutube =
      youtube.length === 0 ? false : plain.length === 0 ? true : random() < 0.5

    if (pickYoutube) result.push(youtube.shift()!)
    else result.push(plain.shift()!)
  }

  return result
}

/** Mix YouTube and non-YouTube awards with random order on each wrap. */
export function shuffleAwardsForDisplay(
  awards: Award[],
  random: () => number = Math.random,
): Award[] {
  const withYoutube = shuffleCopy(
    awards.filter((award) => resolveAwardYoutube(award.youtube)),
    random,
  )
  const withoutYoutube = shuffleCopy(
    awards.filter((award) => !resolveAwardYoutube(award.youtube)),
    random,
  )

  if (withYoutube.length === 0) return withoutYoutube
  if (withoutYoutube.length === 0) return withYoutube

  const youtubeQueue = [...withYoutube]
  const plainQueue = [...withoutYoutube]
  const head = [youtubeQueue.shift()!, plainQueue.shift()!]
  shuffleCopy(head, random)

  return [...head, ...interleaveAwardPools(youtubeQueue, plainQueue, random)]
}

export function buildAwardInsights(
  awards: Record<string, Award> | undefined,
  period: WrappedPeriod,
  random: () => number = Math.random,
): AwardInsights {
  if (!awards || Object.keys(awards).length === 0) {
    return EMPTY_AWARD_INSIGHTS
  }

  const shuffled = shuffleAwardsForDisplay(
    Object.values(awards).filter((award) => awardInPeriod(award, period)),
    random,
  )

  const allItems: AwardItem[] = shuffled.map((award) => {
    const problemId = award.submission?.problem_id ?? null
    return {
      awardId: award.award_id,
      title: award.title,
      info: award.info,
      iconUrl: jutgeAwardIconUrl(award.icon, award.type),
      type: award.type,
      timeLabel: formatAwardTime(award.time),
      youtube: resolveAwardYoutube(award.youtube),
      problemId,
      problemLabel: problemId,
    }
  })

  if (allItems.length === 0) return EMPTY_AWARD_INSIGHTS

  const featured = allItems[0]!
  const title =
    allItems.length === 1
      ? t("awards.titleOne")
      : t("awards.titleMany", { count: allItems.length })

  return {
    count: allItems.length,
    items: allItems,
    featured,
    title,
  }
}

export function buildWrappedInsights(raw: WrappedRawData): WrappedInsights {
  const {
    profile,
    dashboard,
    level,
    absoluteRanking,
    homepageStats,
    hexColors,
    tables,
  } = raw
  const displayName =
    profile.nickname || profile.name || profile.email.split("@")[0] || "Coder"

  const proglangs = distributionToItems(
    dashboard.distributions.proglangs,
    tables,
    hexColors,
    "proglangs",
  )
  const compilers = distributionToItems(
    dashboard.distributions.compilers,
    tables,
    hexColors,
    "compilers",
  )

  const estimatedActiveMinutes = estimateActiveMinutes(raw.submissions)
  const journey = buildJourneyInsights(
    dashboard,
    buildIntroMetricDrilldowns(
      raw.submissions,
      tables,
      raw.problemTitles,
      raw.awards,
      raw.period,
    ),
    estimatedActiveMinutes,
  )
  const heatmap = buildHeatmapInsights(dashboard, raw.period)
  const weekday = buildWeekdayInsights(dashboard)
  const chrono = buildChronoInsights(dashboard)
  const courseArc = buildCourseArcInsights(dashboard, tables, hexColors)
  const verdicts = buildVerdictInsights(dashboard, tables, hexColors)
  const rank = buildRankInsights(absoluteRanking, homepageStats)
  const rankingHighlights = buildRankingHighlights(raw)
  const awards = buildAwardInsights(raw.awards, raw.period)

  return {
    displayName,
    level,
    periodLabel: formatPeriodLabel(raw.period),
    journey,
    heatmap,
    weekday,
    chrono,
    courseArc,
    proglangs,
    compilers,
    verdicts,
    rank,
    rankingHighlights,
    awards,
    personalized: buildPersonalizedInsights(
      raw,
      journey,
      heatmap,
      weekday,
      chrono,
      rank,
    ),
  }
}
