import type {
  AllTables,
  Award,
  ColorMapping,
  Dashboard,
  HomepageStats,
  Profile,
  Submission,
} from "@/lib/jutge_api_client"
import type { WrappedPeriod } from "./period"

export type WrappedRawData = {
  profile: Profile
  avatarUrl: string | null
  dashboard: Dashboard
  level: string
  absoluteRanking: number
  homepageStats: HomepageStats
  hexColors: ColorMapping
  tables: AllTables
  period: WrappedPeriod
  /** When present (e.g. snapshot export), enables full period filtering. */
  submissions?: Submission[]
  /** Human-readable problem titles keyed by problem id. */
  problemTitles?: Record<string, string>
  awards?: Record<string, Award>
}

export type DistributionItem = {
  key: string
  label: string
  count: number
  percent: number
  color?: string
  emoji?: string
  description?: string
}

export type IntroMetricKind = "accepted" | "rejected" | "submissions"

export type IntroProblemAward = {
  awardId: string
  title: string
  iconUrl: string
}

export type IntroProblemItem = {
  problemId: string
  problemLabel: string
  problemTitle: string | null
  submissionCount?: number
  attemptsBeforeAc?: number
  acceptedAtLabel?: string | null
  lastVerdictLabel?: string | null
  awards?: IntroProblemAward[]
}

export type IntroSubmissionItem = {
  submissionId: string
  problemId: string
  problemLabel: string
  problemTitle: string | null
  verdict: string | null
  verdictLabel: string
  timeLabel: string
  timeMs: number
}

export type IntroMetricDrilldowns = {
  available: boolean
  acceptedProblems: IntroProblemItem[]
  rejectedProblems: IntroProblemItem[]
  submissions: IntroSubmissionItem[]
}

export type JourneyInsights = {
  acceptedProblems: number
  rejectedProblems: number
  totalSubmissions: number
  problemSuccessRate: number
  estimatedActiveMinutes: number | null
  firstActive: string | null
  lastActive: string | null
  spanLabel: string
  drilldowns: IntroMetricDrilldowns
}

export type HeatmapYearBlock = {
  year: number
  /** rows = Mon..Sun, cols = weeks */
  grid: number[][]
  labels: (string | null)[][]
  monthLabels: (string | null)[]
  maxCellValue: number
}

export type HeatmapInsights = {
  calendarMode: "single" | "multiYear"
  longestStreak: number
  peakDay: { date: string; count: number; timestamp: number } | null
  peakWeek: { weekLabel: string; total: number } | null
  peakMonth: { monthLabel: string; total: number } | null
  totalActiveDays: number
  totalSubmissions: number
  yearBlocks: HeatmapYearBlock[]
  maxCellValue: number
}

export type WeekdayInsights = {
  weekdays: DistributionItem[]
  peak: DistributionItem | null
  quietest: DistributionItem | null
}

export type ChronoArchetypeKey =
  | "balancedGrinder"
  | "nightOwl"
  | "earlyRiser"
  | "eveningCoder"
  | "afternoonOperator"

export type RhythmTitleKey =
  | ChronoArchetypeKey
  | "weekendWarrior"
  | "sundayScrambler"
  | "saturdaySpecial"
  | "fridayFinisher"
  | "mondayMenace"
  | "midweekMachine"

export type ChronoInsights = {
  archetypeKey: ChronoArchetypeKey
  archetype: string
  nightSubmissions: number
  peakHour: number
  peakHourCount: number
  hours: { hour: number; count: number }[]
  narrative: string
}

export type CourseArcInsights = {
  courseCompilerShare: number
  courseCompilerCount: number
  topProglang: DistributionItem | null
  topCompiler: DistributionItem | null
  otherLanguages: DistributionItem[]
  title: string
  subtitle: string
}

export type VerdictInsights = {
  ac: number
  pe: number
  wa: number
  ce: number
  ee: number
  sc: number
  other: number
  total: number
  acRate: number
  narrative: string
  items: DistributionItem[]
}

export type RankInsights = {
  rank: number
  platformUserCount: number
  percentile: number
  usersAhead: number
  /** Share of users at or above this rank (0–100+, two decimal places). */
  topPercent: number
  eliteLabel: string
}

export type RankingHighlightKind =
  | "first_attempt"
  | "platform_problems"
  | "platform_submissions"
  | "compile_grief"

export type RankingHighlight = {
  kind: RankingHighlightKind
  percent: number
  numerator: number
  denominator: number
}

export type RankingHighlights = {
  items: RankingHighlight[]
}

export type HeroMomentKind = "most_attempted" | "grind" | "first_ac"

export type HeroMomentInsight = {
  kind: HeroMomentKind
  problemId: string
  problemLabel: string
  submissionCount: number
  attemptsBeforeAc: number | null
  detail: string
}

export type SlowSolveInsight = {
  problemId: string
  problemLabel: string
  durationMs: number
  durationLabel: string
  submissionsBeforeAc: number
  detail: string
}

export type AwardItem = {
  awardId: string
  title: string
  info: string
  iconUrl: string
  type: string
  timeLabel: string
  youtube: string | null
  problemId: string | null
  problemLabel: string | null
}

export type AwardInsights = {
  count: number
  items: AwardItem[]
  featured: AwardItem | null
  title: string
}

export type PersonalizedInsights = {
  introSubtitle: string
  introActivity: string | null
  heatmapTitle: string
  heatmapSubtitle: string
  weekdayTitle: string
  weekdaySubtitle: string | undefined
  chronoEyebrow: string
  rhythmTitleKey: RhythmTitleKey
  rankingSubtitle: string
  usersAheadText: string | null
  heroMoment: HeroMomentInsight | null
  slowSolve: SlowSolveInsight | null
}

export type WrappedInsights = {
  displayName: string
  level: string
  periodLabel: string
  journey: JourneyInsights
  heatmap: HeatmapInsights
  weekday: WeekdayInsights
  chrono: ChronoInsights
  courseArc: CourseArcInsights
  proglangs: DistributionItem[]
  compilers: DistributionItem[]
  verdicts: VerdictInsights
  rank: RankInsights
  rankingHighlights: RankingHighlights
  awards: AwardInsights
  personalized: PersonalizedInsights
}
