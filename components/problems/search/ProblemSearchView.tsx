'use client'

import {
    fetchInstructorAnonymousSubmissions,
    fetchInstructorProblemPopularityBuckets,
    fetchMiscHexColors,
} from '@/lib/instructor/client'
import {
    BookmarkIcon,
    BotIcon,
    ChartAreaIcon,
    CircleMinusIcon,
    CirclePlusIcon,
    CogIcon,
    FileCodeIcon,
    FileTerminalIcon,
    FileTextIcon,
    FileTypeIcon,
    MedalIcon,
    ScrollIcon,
    ScrollTextIcon,
    SearchIcon,
    SignatureIcon,
    SkullIcon,
    TagsIcon,
} from 'lucide-react'
import dayjs from 'dayjs'
import { usePathname, useSearchParams } from 'next/navigation'
import { JSX, useEffect, useMemo, useState } from 'react'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Line,
    LineChart,
    Pie,
    PieChart,
    ReferenceLine,
    XAxis,
    YAxis,
} from 'recharts'
import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import StatementDialog from '@/components/instructor/StatementDialog'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { SearchInput } from '@/components/SearchInput'
import { SubNav } from '@/components/general/SubNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownText } from '@/components/general/MarkdownText'
import type { SubNavItem } from '@/store/SubNav'
import {
    AbstractProblem,
    AbstractProblemSuppl,
    AbstractProblemSuppls,
    ColorMapping,
    Distribution,
    Download,
    ProblemAnonymousSubmission,
    ProblemPopularityBucketEntry,
    SearchResults,
} from '@/lib/jutge_api_client'

export type ProblemSearchActions = {
    fetchCatalog: () => Promise<Record<string, AbstractProblem>>
    semanticSearch: (query: string) => Promise<SearchResults>
    fullTextSearch: (query: string) => Promise<SearchResults>
    fetchManySuppl: (problem_nms: string) => Promise<AbstractProblemSuppls>
    fetchPdfStatement: (problem_id: string) => Promise<Download>
    fetchHtmlStatement: (problem_id: string) => Promise<string>
    fetchMarkdownStatement: (problem_id: string) => Promise<string>
    fetchTextStatement: (problem_id: string) => Promise<string>
}
import { offerDownloadFile } from '@/lib/instructor/utils'
import { problemIconUrl } from '@/lib/problems'
import { isMotionReduced } from '@/lib/reducedMotion'
import { cn } from '@/lib/utils'

type ProblemSearchViewProps = {
    actions: ProblemSearchActions
    showInstructorStats?: boolean
    /** Large problem icon on the left inside each result card, as on problem titles. */
    largeResultIcon?: boolean
    initialQuery?: string
}

export function ProblemSearchView({
    actions,
    showInstructorStats = false,
    largeResultIcon = false,
    initialQuery = '',
}: ProblemSearchViewProps) {
    const [allAbstractProblems, setAllAbstractProblems] = useState<Record<string, AbstractProblem> | null>(null)

    useEffect(() => {
        async function load() {
            const data = await actions.fetchCatalog()
            setAllAbstractProblems(data)
        }
        load()
    }, [actions])

    return (
        <SearchViewInner
            actions={actions}
            allAbstractProblems={allAbstractProblems}
            showInstructorStats={showInstructorStats}
            largeResultIcon={largeResultIcon}
            initialQuery={initialQuery}
        />
    )
}

type SearchViewProps = {
    actions: ProblemSearchActions
    allAbstractProblems: Record<string, AbstractProblem> | null
    showInstructorStats: boolean
    largeResultIcon: boolean
    initialQuery?: string
}

function SearchViewInner(props: SearchViewProps) {
    const [searching, setSearching] = useState(false)
    const [results, setResults] = useState<SearchResults | undefined>(undefined)
    const [suppls, setSuppls] = useState<AbstractProblemSuppls | null>(null)

    const [semanticQuery, setSemanticQuery] = useState(props.initialQuery ?? '')
    const [fullTextQuery, setFullTextQuery] = useState(props.initialQuery ?? '')

    useEffect(() => {
        if (!results || results.length === 0) {
            setSuppls(null)
            return
        }
        let cancelled = false
        const problemNms = results.map((result) => result.problem_nm).join(',')
        ;(async () => {
            const data = await props.actions.fetchManySuppl(problemNms)
            if (!cancelled) setSuppls(data)
        })()
        return () => {
            cancelled = true
        }
    }, [results, props.actions])

    async function semanticSearch() {
        if (searching) return
        setResults(undefined)
        const query = semanticQuery.trim()
        setSemanticQuery(query)
        if (query.length === 0) return
        setSearching(true)
        const results = await props.actions.semanticSearch(query)
        setSearching(false)
        setResults(results)
    }

    async function fullTextSearch() {
        if (searching) return
        setResults(undefined)
        const query = fullTextQuery.trim()
        setFullTextQuery(query)
        if (query.length === 0) return
        setSearching(true)
        const results = await props.actions.fullTextSearch(query)
        setSearching(false)
        setResults(results)
    }

    return (
        <div>
            <SearchTabsComponent
                semanticQuery={semanticQuery}
                setSemanticQuery={setSemanticQuery}
                fullTextQuery={fullTextQuery}
                setFullTextQuery={setFullTextQuery}
                handleSemanticSearch={semanticSearch}
                handleFullTextSearch={fullTextSearch}
            />

            {searching && <Searching />}

            {results && results.length === 0 && (
                <div className="border rounded-lg p-8 mb-4 flex flex-col justify-center items-center">
                    <div className="text-sm">No results found</div>
                </div>
            )}

            {results && props.allAbstractProblems && (
                <div className="flex flex-col gap-4">
                    {results
                        .filter((result) => result.problem_nm in props.allAbstractProblems!)
                        .map((result) => (
                            <Result
                                key={result.problem_nm}
                                result={result}
                                allAbstractProblems={props.allAbstractProblems!}
                                abspbmSuppl={suppls?.[result.problem_nm] ?? null}
                                actions={props.actions}
                                showInstructorStats={props.showInstructorStats}
                                largeResultIcon={props.largeResultIcon}
                            />
                        ))}
                </div>
            )}
        </div>
    )
}

type ResultProps = {
    result: {
        problem_nm: string
        score: number
    }
    allAbstractProblems: Record<string, AbstractProblem>
    abspbmSuppl: AbstractProblemSuppl | null
    actions: ProblemSearchActions
    showInstructorStats: boolean
    largeResultIcon: boolean
}

type SearchDashboardStats = {
    totalSubmissions: number
    totalUsers: number
    passRatePct: number
    neverPassed: number
}

/** Same metrics as StatisticsDashboardCard on the problem statistics page. */
function computeSearchDashboardStats(submissions: ProblemAnonymousSubmission[]): SearchDashboardStats {
    const userStatus = new Map<string, boolean>()
    for (const s of submissions) {
        const hasAc = userStatus.get(s.anonymous_user_id)
        if (!hasAc) userStatus.set(s.anonymous_user_id, s.verdict === 'AC')
        else if (s.verdict === 'AC') userStatus.set(s.anonymous_user_id, true)
    }
    let usersOk = 0
    let usersKo = 0
    for (const ok of userStatus.values()) {
        if (ok) usersOk += 1
        else usersKo += 1
    }
    const totalUsers = usersOk + usersKo
    return {
        totalSubmissions: submissions.length,
        totalUsers,
        passRatePct: totalUsers > 0 ? (usersOk / totalUsers) * 100 : 0,
        neverPassed: usersKo,
    }
}

// --- Compact stats charts (aligned with problem statistics page) ---

const COMPACT_PIE_MIN_PCT = 5

function getCategoryColor(key: string, category: string, colors: ColorMapping): string {
    if (!(category in colors) || !(key in colors[category])) {
        return 'hsl(var(--chart-1))'
    }
    return colors[category][key]
}

type VolumeOverTimePoint = { year: number; label: string; ok: number; ko: number }

type AttemptsToSolvePoint = {
    attempts: number
    label: string
    passed: number
    neverPassed?: number
}

type TimeToFirstPassPoint = { hours: number; label: string; cumulativePct: number }

function computeTimeToFirstPassFunnel(submissions: ProblemAnonymousSubmission[]): {
    curve: TimeToFirstPassPoint[]
    totalSolvers: number
    neverSolved: number
    medianHours: number | null
} {
    const byUser = new Map<string, { firstTime: number; firstAcTime: number | null }>()
    for (const s of submissions) {
        const t = dayjs(s.time).valueOf()
        const existing = byUser.get(s.anonymous_user_id)
        if (!existing) {
            byUser.set(s.anonymous_user_id, {
                firstTime: t,
                firstAcTime: s.verdict === 'AC' ? t : null,
            })
        } else {
            if (t < existing.firstTime) existing.firstTime = t
            if (s.verdict === 'AC' && (existing.firstAcTime === null || t < existing.firstAcTime)) {
                existing.firstAcTime = t
            }
        }
    }
    const deltasHours: number[] = []
    let neverSolved = 0
    for (const { firstTime, firstAcTime } of byUser.values()) {
        if (firstAcTime != null) {
            deltasHours.push((firstAcTime - firstTime) / (60 * 60 * 1000))
        } else {
            neverSolved += 1
        }
    }
    deltasHours.sort((a, b) => a - b)
    const totalSolvers = deltasHours.length
    const medianHours = totalSolvers > 0 ? deltasHours[Math.floor(totalSolvers / 2)] : null
    const timeBucketsHours = [0, 0.25, 0.5, 1, 2, 4, 8, 12, 24, 48, 72, 168]
    const curve: TimeToFirstPassPoint[] = timeBucketsHours.map((hours) => {
        const count = totalSolvers === 0 ? 0 : deltasHours.filter((d) => d <= hours).length
        const cumulativePct = totalSolvers === 0 ? 0 : (count / totalSolvers) * 100
        let label: string
        if (hours < 1) label = `${Math.round(hours * 60)}m`
        else if (hours < 24) label = `${hours}h`
        else label = `${hours / 24}d`
        return { hours, label, cumulativePct }
    })
    return { curve, totalSolvers, neverSolved, medianHours }
}

function computeAttemptsToSolve(submissions: ProblemAnonymousSubmission[]): {
    histogram: AttemptsToSolvePoint[]
    medianAttempts: number | null
    totalPassed: number
    neverPassedCount: number
} {
    const byUser = new Map<string, { time: string; verdict: string }[]>()
    for (const s of submissions) {
        let list = byUser.get(s.anonymous_user_id)
        if (!list) {
            list = []
            byUser.set(s.anonymous_user_id, list)
        }
        list.push({ time: s.time, verdict: s.verdict })
    }
    for (const list of byUser.values()) {
        list.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    }
    const attemptCounts: number[] = []
    let neverPassedCount = 0
    for (const list of byUser.values()) {
        const firstAcIndex = list.findIndex((s) => s.verdict === 'AC')
        if (firstAcIndex >= 0) {
            attemptCounts.push(firstAcIndex + 1)
        } else {
            neverPassedCount += 1
        }
    }
    attemptCounts.sort((a, b) => a - b)
    const totalPassed = attemptCounts.length
    const medianAttempts = totalPassed > 0 ? attemptCounts[Math.floor(totalPassed / 2)] : null
    const maxAttempts = attemptCounts.length > 0 ? Math.max(...attemptCounts) : 0
    const bucketCount: Record<number, number> = {}
    for (let k = 1; k <= maxAttempts; k++) bucketCount[k] = 0
    for (const k of attemptCounts) {
        bucketCount[k] = (bucketCount[k] ?? 0) + 1
    }
    const histogram: AttemptsToSolvePoint[] = []
    for (let k = 1; k <= maxAttempts; k++) {
        histogram.push({
            attempts: k,
            label: String(k),
            passed: bucketCount[k] ?? 0,
        })
    }
    if (neverPassedCount > 0) {
        histogram.push({
            attempts: maxAttempts + 1,
            label: 'No AC',
            passed: 0,
            neverPassed: neverPassedCount,
        })
    }
    return { histogram, medianAttempts, totalPassed, neverPassedCount }
}

function deriveCompactChartData(submissions: ProblemAnonymousSubmission[]) {
    const isOk = (verdict: string) => verdict === 'AC'

    const userStatus = new Map<string, boolean>()
    for (const s of submissions) {
        const hasAc = userStatus.get(s.anonymous_user_id)
        if (!hasAc) userStatus.set(s.anonymous_user_id, s.verdict === 'AC')
        else if (s.verdict === 'AC') userStatus.set(s.anonymous_user_id, true)
    }
    let usersOk = 0
    let usersKo = 0
    for (const ok of userStatus.values()) {
        if (ok) usersOk += 1
        else usersKo += 1
    }
    const usersOkKo: Distribution = { OK: usersOk, KO: usersKo }

    const acCount = submissions.filter((s) => s.verdict === 'AC').length
    const submissionsOkKo: Distribution = {
        OK: acCount,
        KO: submissions.length - acCount,
    }

    const verdicts: Distribution = {}
    const compilers: Distribution = {}
    const proglangs: Distribution = {}
    for (const s of submissions) {
        verdicts[s.verdict] = (verdicts[s.verdict] ?? 0) + 1
        compilers[s.compiler_id] = (compilers[s.compiler_id] ?? 0) + 1
        proglangs[s.proglang] = (proglangs[s.proglang] ?? 0) + 1
    }

    const submissionVolumeOverTime: VolumeOverTimePoint[] = (() => {
        if (submissions.length === 0) return []
        const byYear = new Map<number, { ok: number; ko: number }>()
        for (const s of submissions) {
            const year = dayjs(s.time).year()
            const existing = byYear.get(year) ?? { ok: 0, ko: 0 }
            if (isOk(s.verdict)) existing.ok += 1
            else existing.ko += 1
            byYear.set(year, existing)
        }
        const years = Array.from(byYear.keys()).sort((a, b) => a - b)
        return years.map((year) => {
            const { ok = 0, ko = 0 } = byYear.get(year) ?? {}
            return { year, label: String(year), ok, ko }
        })
    })()

    return {
        usersOkKo,
        submissionsOkKo,
        verdicts,
        compilers,
        proglangs,
        attemptsToSolve: computeAttemptsToSolve(submissions),
        timeToFirstPass: computeTimeToFirstPassFunnel(submissions),
        submissionVolumeOverTime,
    }
}

function CompactPieChart({ data, category, colors }: { data: Distribution; category: string; colors: ColorMapping }) {
    const totalCount = Object.values(data).reduce((a, b) => a + b, 0)
    if (totalCount === 0) {
        return <div className="flex h-[110px] items-center justify-center text-xs text-muted-foreground">No data</div>
    }
    const dataClone = structuredClone(data)
    const total = Math.max(
        1,
        Object.values(dataClone).reduce((a, b) => a + b, 0),
    )
    for (const key of Object.keys(dataClone)) {
        dataClone[key] = Math.round((dataClone[key] / total) * 1000) / 10
    }
    const chartConfig: Record<string, { label: string; color: string }> = {
        value: { label: 'Percentage', color: 'transparent' },
    }
    let othersSum = 0
    let othersCount = 0
    let singleKey = ''
    for (const key of Object.keys(dataClone)) {
        if (dataClone[key] < COMPACT_PIE_MIN_PCT) {
            othersSum += dataClone[key]
            othersCount += 1
            singleKey = key
        } else {
            chartConfig[key] = {
                label: key,
                color: getCategoryColor(key, category, colors),
            }
        }
    }
    const chartData = Object.entries(dataClone)
        .filter(([, value]) => value >= COMPACT_PIE_MIN_PCT)
        .map(([key, value]) => ({
            label: key,
            value,
            fill: chartConfig[key]?.color ?? 'hsl(var(--chart-5))',
        }))
    if (othersSum > 0) {
        const label = othersCount === 1 ? singleKey : 'Others'
        chartData.push({
            label,
            value: othersSum,
            fill: 'hsl(var(--chart-5))',
        })
        chartConfig[label] = { label, color: 'hsl(var(--chart-5))' }
    }
    return (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[130px]">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                <Pie data={chartData} dataKey="value" innerRadius={24}>
                    <LabelList
                        dataKey="label"
                        className="fill-background"
                        stroke="none"
                        fontSize={9}
                        formatter={(value) => chartConfig[String(value)]?.label}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
    )
}

function CompactStatCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Card className="min-w-0 overflow-hidden">
            <CardHeader className="space-y-0 p-2 pb-1">
                <CardTitle className="text-xs font-medium leading-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-1 pt-0">{children}</CardContent>
        </Card>
    )
}

function CompactAttemptsChartOnly({
    histogram,
    medianAttempts,
    colors,
}: {
    histogram: AttemptsToSolvePoint[]
    medianAttempts: number | null
    colors: ColorMapping
}) {
    const chartConfig = {
        label: { label: 'Attempts', color: 'hsl(var(--muted-foreground))' },
        passed: { label: 'Passed (AC)', color: getCategoryColor('OK', 'statuses', colors) },
        neverPassed: {
            label: 'Did not pass',
            color: getCategoryColor('KO', 'statuses', colors),
        },
    }
    const formatCount = (value: unknown) => [String(value), 'Students'] as [string, string]
    if (histogram.length === 0) {
        return <div className="flex h-[132px] items-center justify-center text-xs text-muted-foreground">No data</div>
    }
    return (
        <ChartContainer config={chartConfig} className="h-[132px] w-full aspect-auto">
            <BarChart data={histogram} margin={{ top: 16, right: 4, bottom: 2, left: 32 }} barCategoryGap="10%">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 10 }} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent formatter={formatCount} labelFormatter={(label) => `Attempts: ${label}`} />
                    }
                />
                {medianAttempts != null && (
                    <ReferenceLine
                        x={String(medianAttempts)}
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        label={{
                            value: 'Median',
                            position: 'top',
                            fill: 'hsl(var(--chart-3))',
                            fontSize: 10,
                        }}
                    />
                )}
                <Bar dataKey="passed" fill="var(--color-passed)" stackId="a" radius={[0, 0, 3, 3]} />
                <Bar dataKey="neverPassed" fill="var(--color-neverPassed)" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
        </ChartContainer>
    )
}

function CompactTimeToSolveChartOnly({ curve }: { curve: TimeToFirstPassPoint[] }) {
    const chartConfig = {
        hours: { label: 'Hours', color: 'hsl(var(--muted-foreground))' },
        cumulativePct: { label: '% solved', color: 'hsl(var(--chart-1))' },
    }
    const formatPct = (value: unknown) => [`${Number(value).toFixed(1)}%`, 'Solved by this time'] as [string, string]
    const formatTimeLabel = (label: unknown) => {
        const h = Number(label)
        return h < 1 ? `${Math.round(h * 60)} min` : h < 24 ? `${h} h` : `${(h / 24).toFixed(1)} days`
    }
    if (curve.length === 0 || curve.every((p) => p.cumulativePct === 0)) {
        return (
            <div className="flex h-[132px] items-center justify-center text-xs text-muted-foreground">
                No solvers yet
            </div>
        )
    }
    return (
        <ChartContainer config={chartConfig} className="h-[132px] w-full aspect-auto">
            <LineChart data={curve} margin={{ top: 6, right: 4, bottom: 2, left: 2 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                    dataKey="hours"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 9 }}
                    tickFormatter={(h: number) => (h < 1 ? `${Math.round(h * 60)}m` : h < 24 ? `${h}h` : `${h / 24}d`)}
                />
                <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    tick={{ fontSize: 9 }}
                    tickFormatter={(v: number) => `${v}%`}
                />
                <ChartTooltip
                    content={<ChartTooltipContent formatter={formatPct} labelFormatter={formatTimeLabel} />}
                />
                <Line
                    type="monotone"
                    dataKey="cumulativePct"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                />
            </LineChart>
        </ChartContainer>
    )
}

function CompactSubmissionVolumeChart({ data, colors }: { data: VolumeOverTimePoint[]; colors: ColorMapping }) {
    const chartConfig = {
        year: { label: 'Year', color: 'hsl(var(--muted-foreground))' },
        ok: { label: 'OK (AC)', color: getCategoryColor('OK', 'statuses', colors) },
        ko: { label: 'KO', color: getCategoryColor('KO', 'statuses', colors) },
    }
    const formatCount = (value: unknown) => [String(value), 'Submissions'] as [string, string]
    if (data.length === 0) {
        return (
            <div className="flex h-[132px] items-center justify-center text-xs text-muted-foreground">
                No submission data
            </div>
        )
    }
    return (
        <ChartContainer config={chartConfig} className="h-[132px] w-full aspect-auto">
            <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 2, left: 2 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            formatter={formatCount}
                            labelFormatter={(_, payload) => {
                                const p = payload?.[0]?.payload as VolumeOverTimePoint | undefined
                                return p ? String(p.year) : ''
                            }}
                        />
                    }
                />
                <Area
                    type="monotone"
                    dataKey="ok"
                    stackId="a"
                    stroke="var(--color-ok)"
                    fill="var(--color-ok)"
                    fillOpacity={0.6}
                />
                <Area
                    type="monotone"
                    dataKey="ko"
                    stackId="a"
                    stroke="var(--color-ko)"
                    fill="var(--color-ko)"
                    fillOpacity={0.6}
                />
            </AreaChart>
        </ChartContainer>
    )
}

function formatPopularityBucketPowerLabel(b: ProblemPopularityBucketEntry): string {
    const { bucket_min, bucket_max, log2_bucket } = b
    const openEnded = bucket_max > 1e15 || bucket_max <= bucket_min
    if (bucket_min === 0 && bucket_max <= 1) {
        return '0'
    }
    if (openEnded) {
        return `2^${log2_bucket}+`
    }
    return `2^${log2_bucket}`
}

function buildPopularityChartData(buckets: ProblemPopularityBucketEntry[]) {
    return [...buckets]
        .sort((a, b) => a.bucket_min - b.bucket_min)
        .map((b) => ({
            label: formatPopularityBucketPowerLabel(b),
            problem_count: b.problem_count,
        }))
}

function findPopularityBucketLabel(buckets: ProblemPopularityBucketEntry[], totalSubmissions: number): string | null {
    if (buckets.length === 0) return null
    const sorted = [...buckets].sort((a, b) => a.bucket_min - b.bucket_min)
    for (let i = 0; i < sorted.length; i++) {
        const b = sorted[i]
        const isLast = i === sorted.length - 1
        if (isLast) {
            if (totalSubmissions >= b.bucket_min) return formatPopularityBucketPowerLabel(b)
        } else if (totalSubmissions >= b.bucket_min && totalSubmissions < b.bucket_max) {
            return formatPopularityBucketPowerLabel(b)
        }
    }
    if (totalSubmissions < sorted[0].bucket_min) {
        return formatPopularityBucketPowerLabel(sorted[0])
    }
    return formatPopularityBucketPowerLabel(sorted[sorted.length - 1])
}

function CompactProblemPopularityChart({
    buckets,
    problemTotalSubmissions,
}: {
    buckets: ProblemPopularityBucketEntry[]
    problemTotalSubmissions: number
}) {
    const chartData = useMemo(() => buildPopularityChartData(buckets), [buckets])
    const markerLabel = useMemo(
        () => findPopularityBucketLabel(buckets, problemTotalSubmissions),
        [buckets, problemTotalSubmissions],
    )
    const chartConfig = {
        label: { label: 'Submissions (per problem)', color: 'hsl(var(--muted-foreground))' },
        problem_count: {
            label: 'Problems in bucket',
            color: 'hsl(221 83% 53%)',
        },
    }
    const formatCount = (value: unknown) => [String(value), 'Problems'] as [string, string]

    if (chartData.length === 0) {
        return (
            <div className="flex h-[148px] items-center justify-center text-xs text-muted-foreground">
                No popularity data
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-[148px] w-full aspect-auto">
            <BarChart data={chartData} margin={{ top: 18, right: 2, bottom: 22, left: 28 }} barCategoryGap="10%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fontSize: 7 }}
                    angle={-40}
                    textAnchor="end"
                    height={26}
                />
                <YAxis tickLine={false} axisLine={false} width={26} allowDecimals={false} tick={{ fontSize: 8 }} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            formatter={formatCount}
                            labelFormatter={(label) => `Bucket starts at ${label}`}
                        />
                    }
                />
                {markerLabel != null && (
                    <ReferenceLine
                        x={markerLabel}
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        label={{
                            value: 'This',
                            position: 'top',
                            fill: 'hsl(var(--chart-3))',
                            fontSize: 9,
                        }}
                    />
                )}
                <Bar
                    dataKey="problem_count"
                    fill="var(--color-problem_count)"
                    radius={[2, 2, 0, 0]}
                    name="Problems in bucket"
                />
            </BarChart>
        </ChartContainer>
    )
}

function CompactProblemStats({ problem_nm }: { problem_nm: string }) {
    const [submissions, setSubmissions] = useState<ProblemAnonymousSubmission[] | null>(null)
    const [popularityBuckets, setPopularityBuckets] = useState<ProblemPopularityBucketEntry[]>([])
    const [colors, setColors] = useState<ColorMapping | null>(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setFailed(false)
        setSubmissions(null)
        setColors(null)
        setPopularityBuckets([])
        ;(async () => {
            try {
                const [subs, colorMap, buckets] = await Promise.all([
                    fetchInstructorAnonymousSubmissions(problem_nm),
                    fetchMiscHexColors(),
                    fetchInstructorProblemPopularityBuckets().catch(() => []),
                ])
                if (!cancelled) {
                    setSubmissions(subs)
                    setColors(colorMap)
                    setPopularityBuckets(Array.isArray(buckets) ? buckets : [])
                }
            } catch {
                if (!cancelled) setFailed(true)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [problem_nm])

    const derived = useMemo(() => (submissions ? deriveCompactChartData(submissions) : null), [submissions])
    const stats = useMemo(() => (submissions ? computeSearchDashboardStats(submissions) : null), [submissions])

    if (loading) {
        return <span className="text-muted-foreground text-xs animate-pulse">Loading stats…</span>
    }
    if (failed || !derived || !stats || !colors) {
        return <span className="text-muted-foreground text-xs">Stats unavailable</span>
    }

    const totalUsers = stats.totalUsers
    const avg = totalUsers > 0 ? (stats.totalSubmissions / totalUsers).toFixed(1) : '—'
    const acPct = totalUsers > 0 ? Math.round(stats.passRatePct) : 0

    return (
        <div className="flex w-full min-w-0 flex-col gap-2">
            <div className="border rounded-lg p-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                    <span className="font-medium text-foreground">{stats.totalSubmissions}</span> subs
                </span>
                <span className="text-border">·</span>
                <span>
                    <span className="font-medium text-foreground">{stats.totalUsers}</span> users
                </span>
                <span className="text-border">·</span>
                <span>
                    <span className="font-medium text-foreground">{avg}</span> avg subs/user
                </span>
                <span className="text-border">·</span>
                <span>
                    <span className="font-medium text-foreground">{acPct}%</span> AC rate
                </span>
                <span className="text-border">·</span>
                <span>
                    <span className="font-medium text-foreground">{stats.neverPassed}</span> fails
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <CompactStatCard title="User statuses">
                    <CompactPieChart data={derived.usersOkKo} category="statuses" colors={colors} />
                </CompactStatCard>
                <CompactStatCard title="Submission statuses">
                    <CompactPieChart data={derived.submissionsOkKo} category="statuses" colors={colors} />
                </CompactStatCard>
                <CompactStatCard title="Submissions by verdict">
                    <CompactPieChart data={derived.verdicts} category="verdicts" colors={colors} />
                </CompactStatCard>
                <CompactStatCard title="Compilers">
                    <CompactPieChart data={derived.compilers} category="compilers" colors={colors} />
                </CompactStatCard>
                <CompactStatCard title="Programming languages">
                    <CompactPieChart data={derived.proglangs} category="proglangs" colors={colors} />
                </CompactStatCard>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                <CompactStatCard title="Problem popularity">
                    <CompactProblemPopularityChart
                        buckets={popularityBuckets}
                        problemTotalSubmissions={stats.totalSubmissions}
                    />
                </CompactStatCard>
                <CompactStatCard title="Attempts to solve">
                    <CompactAttemptsChartOnly
                        histogram={derived.attemptsToSolve.histogram}
                        medianAttempts={derived.attemptsToSolve.medianAttempts}
                        colors={colors}
                    />
                </CompactStatCard>
                <CompactStatCard title="Time to solve">
                    <CompactTimeToSolveChartOnly curve={derived.timeToFirstPass.curve} />
                </CompactStatCard>
                <CompactStatCard title="Submissions over time">
                    <CompactSubmissionVolumeChart data={derived.submissionVolumeOverTime} colors={colors} />
                </CompactStatCard>
            </div>
        </div>
    )
}

function Result(props: ResultProps) {
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)
    const [statement, setStatement] = useState<JSX.Element | null>(null)
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false)

    const abspbm = props.allAbstractProblems[props.result.problem_nm]
    const iconUrl = problemIconUrl(abspbm.icon)
    const [pbm, setPbm] = useState(
        Object.values(abspbm.problems).find((p) => p.original_language_id === p.language_id)!,
    )
    const [detailsOpen, setDetailsOpen] = useState(false)

    function click(language_id: string) {
        setPbm(Object.values(abspbm.problems).find((p) => p.language_id === language_id)!)
    }

    async function pdfFile() {
        const download = await props.actions.fetchPdfStatement(pbm.problem_id)
        offerDownloadFile(download)
    }

    async function htmlFile() {
        const htmlStatement = await props.actions.fetchHtmlStatement(pbm.problem_id)
        setStatement(
            <div
                className="border rounded-lg p-4 w-full h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: htmlStatement }}
            />,
        )
        setIsStatementDialogOpen(true)
    }

    async function textFile() {
        const textStatement = await props.actions.fetchTextStatement(pbm.problem_id)
        setStatement(<Textarea className="text-sm w-full h-96" value={textStatement} />)
        setIsStatementDialogOpen(true)
    }

    async function markdownFile() {
        const markdownStatement = await props.actions.fetchMarkdownStatement(pbm.problem_id)
        setStatement(
            <div className="text-sm border rounded-lg p-4 w-full h-96 overflow-y-auto">
                <MarkdownText className="max-w-none text-foreground">{markdownStatement}</MarkdownText>
            </div>,
        )
        setIsStatementDialogOpen(true)
    }

    return (
        <div
            className={cn(
                'border rounded-lg px-4 py-3',
                props.largeResultIcon ? 'flex items-start gap-4' : 'flex flex-col',
            )}
        >
            {props.largeResultIcon ? (
                iconUrl ? (
                    <ProblemIconImage
                        iconUrl={iconUrl}
                        size="lg"
                        className={cn(!motionReduced && 'hover:animate-[spin_3s_linear_infinite]')}
                    />
                ) : (
                    <span className="size-28 shrink-0" aria-hidden />
                )
            ) : null}
            <div className={cn('min-w-0 flex flex-col', props.largeResultIcon && 'flex-1')}>
                <div className="mb-1 flex flex-row gap-2">
                    {!props.largeResultIcon && iconUrl ? (
                        <ProblemIconImage iconUrl={iconUrl} size="sm" className="mt-0.5" />
                    ) : null}
                    <a href={`/problems/${props.result.problem_nm}`} className="font-bold text-primary hover:underline">
                        {props.result.problem_nm}
                    </a>
                    <div />
                    {Object.values(abspbm.problems)
                        .sort((a, b) => a.language_id.localeCompare(b.language_id))
                        .map((p) => (
                            <Badge
                                key={p.language_id}
                                onClick={() => click(p.language_id)}
                                variant={pbm.language_id == p.language_id ? 'default' : 'outline'}
                                className="w-8 flex items-center justify-center cursor-pointer"
                            >
                                {p.language_id}
                            </Badge>
                        ))}
                    <div />
                    <div className="flex-grow" />
                </div>
                <div className="space-y-1" />
                <div className="flex flex-row">
                    {detailsOpen ? (
                        <CircleMinusIcon
                            className="inline-block mr-2 mt-1 text-primary"
                            size={16}
                            onClick={() => setDetailsOpen(false)}
                        />
                    ) : (
                        <CirclePlusIcon
                            className="inline-block mr-2 mt-1 text-primary"
                            size={16}
                            onClick={() => setDetailsOpen(true)}
                        />
                    )}
                    <div className="font-bold">{pbm.title || 'Untitled problem'}</div>
                </div>

                <div className="mt-1 ml-6 text-sm flex flex-col gap-1">
                    {abspbm.author && (
                        <div className="w-full flex flex-row">
                            <div className="w-8">
                                <SignatureIcon className="inline-block mr-1 mb-1" size={16} />
                            </div>
                            <div className="w-full">
                                {abspbm.author}
                                {pbm.translator && pbm.translator != abspbm.author && (
                                    <span> (translated by {pbm.translator})</span>
                                )}
                            </div>
                        </div>
                    )}
                    {pbm.summary && (
                        <div className="w-full flex flex-row">
                            <div className="w-8">
                                <TagsIcon className="inline-block mr-1 mb-1" size={16} />
                            </div>
                            <div className="w-full">{pbm.summary.keywords.replaceAll(',', ', ')}</div>
                        </div>
                    )}
                    {pbm.summary && (
                        <div className="w-full flex flex-row ">
                            <div className="w-8">
                                <ScrollIcon className="inline-block mr-1 mb-1" size={16} />
                            </div>
                            <div className="w-full">{pbm.summary.summary_1s}</div>
                        </div>
                    )}
                    {detailsOpen && pbm.summary && (
                        <div className="w-full flex flex-row ">
                            <div className="w-8">
                                <ScrollTextIcon className="inline-block mr-1 mb-1" size={16} />
                            </div>
                            <div className="w-full">{pbm.summary.summary_1p}</div>
                        </div>
                    )}
                    {detailsOpen && abspbm.solution_tags && (
                        <div className="w-full flex flex-row">
                            <div className="w-8">
                                <BookmarkIcon className="inline-block mr-1 mb-1" size={16} />
                            </div>
                            <div className="w-full">{abspbm.solution_tags.tags.replaceAll(',', ', ')}</div>
                        </div>
                    )}
                    {detailsOpen && (
                        <div className="w-full flex flex-row">
                            <div className="w-8">
                                <CogIcon className="inline-block mr-1 mb-1" size={16} />
                            </div>
                            <div className="w-full flex flex-row gap-2">
                                <Badge className="px-2 rounded-full" variant="secondary">
                                    {abspbm.driver_id}
                                </Badge>
                                {abspbm.compilers && (
                                    <Badge className="px-2 rounded-full" variant="secondary">
                                        {abspbm.compilers}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                    {detailsOpen && props.abspbmSuppl && (
                        <div className="w-full flex flex-row">
                            <div className="w-8">
                                <MedalIcon className="inline-block mr-1 mb-1" size={16} />
                            </div>
                            <div className="whitespace-nowrap overflow-auto text-ellipsis w-full flex flex-row gap-2">
                                {props.abspbmSuppl.proglangs_with_ac.map((lang) => (
                                    <Badge key={lang} className="px1.52 rounded-full" variant="secondary">
                                        {lang}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    {abspbm.deprecation && (
                        <div className="w-full flex flex-row">
                            <div className="w-8">
                                <SkullIcon className="inline-block mr-1 mb-1 text-red-500" size={16} />
                            </div>
                            <div className="w-full">Deprecated! {abspbm.deprecation}</div>
                        </div>
                    )}
                    {detailsOpen && (
                        <div className="mt-1 w-full flex flex-row">
                            <div className="w-8"></div>
                            <div className="w-full flex flex-row gap-2">
                                <FileTextIcon
                                    className="inline-block cursor-pointer"
                                    size={48}
                                    strokeWidth={0.6}
                                    onClick={pdfFile}
                                />
                                <FileCodeIcon
                                    className="inline-block cursor-pointer"
                                    size={48}
                                    strokeWidth={0.6}
                                    onClick={htmlFile}
                                />
                                <FileTerminalIcon
                                    className="inline-block cursor-pointer"
                                    size={48}
                                    strokeWidth={0.6}
                                    onClick={markdownFile}
                                />
                                <FileTypeIcon
                                    className="inline-block cursor-pointer"
                                    size={48}
                                    strokeWidth={0.6}
                                    onClick={textFile}
                                />
                            </div>
                        </div>
                    )}

                    {detailsOpen && props.showInstructorStats && (
                        <div className="w-full flex flex-row mt-2">
                            <div className="w-8 shrink-0">
                                <ChartAreaIcon className="inline-block mr-1 mt-2" size={16} />
                            </div>
                            <div className="w-full min-w-0">
                                <CompactProblemStats problem_nm={props.result.problem_nm} />
                            </div>
                        </div>
                    )}
                </div>
                <StatementDialog
                    problem_id={pbm.problem_id}
                    content={statement}
                    isOpen={isStatementDialogOpen}
                    setIsOpen={setIsStatementDialogOpen}
                />
            </div>
        </div>
    )
}

function Searching() {
    return (
        <div className="border rounded-lg p-8 mb-4 flex flex-col justify-center items-center">
            <CogIcon size={48} className="animate-spin" strokeWidth={1} />
            <div className="animate-pulse text-sm">Searching</div>
        </div>
    )
}

type SearchMode = 'semantic' | 'fulltext'

function searchModeHref(pathname: string, mode: SearchMode, current: URLSearchParams): string {
    const params = new URLSearchParams(current.toString())
    if (mode === 'semantic') {
        params.delete('mode')
    } else {
        params.set('mode', 'fulltext')
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
}

type SearchTabsComponentProps = {
    semanticQuery: string
    setSemanticQuery: (query: string) => void
    fullTextQuery: string
    setFullTextQuery: (query: string) => void
    handleSemanticSearch: () => void
    handleFullTextSearch: () => void
}

function SearchTabsComponent(props: SearchTabsComponentProps) {
    const pathname = usePathname() ?? ''
    const searchParams = useSearchParams()
    const mode: SearchMode = searchParams.get('mode') === 'fulltext' ? 'fulltext' : 'semantic'

    const subNavItems = useMemo((): readonly SubNavItem[] => {
        const params = new URLSearchParams(searchParams.toString())
        return [
            {
                key: 'semantic',
                label: 'Semantic search',
                href: searchModeHref(pathname, 'semantic', params),
            },
            {
                key: 'fulltext',
                label: 'Text search',
                href: searchModeHref(pathname, 'fulltext', params),
            },
        ]
    }, [pathname, searchParams])

    return (
        <>
            <SubNav ariaLabel="Search modes" activeKey={mode} items={subNavItems} />
            <div className="w-full border border-border bg-muted rounded-lg p-6 mb-4">
                <div className="w-full space-y-4 sm:w-3/4 sm:mx-auto">
                    <TooltipProvider>
                        {mode === 'semantic' ? (
                            <>
                                <div className="flex gap-2">
                                    <SearchInput
                                        type="text"
                                        placeholder="Your query"
                                        value={props.semanticQuery}
                                        onChange={(e) => props.setSemanticQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && props.handleSemanticSearch()}
                                        className="flex-1"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={props.handleSemanticSearch}
                                                size="icon"
                                                className="shrink-0"
                                                aria-label="Semantic search"
                                            >
                                                <BotIcon className="h-4 w-4" aria-hidden />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Semantic search</TooltipContent>
                                    </Tooltip>
                                </div>
                                <p className="text-sm text-muted-foreground text-justify">
                                    Semantic search understands the meaning, language and context of your query to find
                                    relevant results about problems. Problems are reindexed each night.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <SearchInput
                                        type="text"
                                        placeholder="Your query"
                                        value={props.fullTextQuery}
                                        onChange={(e) => props.setFullTextQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && props.handleFullTextSearch()}
                                        className="flex-1"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={props.handleFullTextSearch}
                                                size="icon"
                                                className="shrink-0"
                                                aria-label="Text search"
                                            >
                                                <SearchIcon className="h-4 w-4" aria-hidden />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Text search</TooltipContent>
                                    </Tooltip>
                                </div>
                                <p className="text-sm text-muted-foreground text-justify">
                                    Text search looks for exact keyword matches in the title, statement, keywords and
                                    summaries of problems. Use boolean operators (AND, OR, NOT) and parentheses for more
                                    precise results. Use quotes for exact phrases. Problems are reindexed each night.
                                </p>
                            </>
                        )}
                    </TooltipProvider>
                </div>
            </div>
        </>
    )
}
