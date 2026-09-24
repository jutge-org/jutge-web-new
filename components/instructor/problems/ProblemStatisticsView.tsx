'use client'

/**
 * Problem statistics page: pie charts (users, submissions, verdicts, compilers, languages),
 * submission heatmap by day, time-to-first-pass funnel, and stacked OK/KO bar charts.
 */

import { Heatmap } from '@/components/instructor/Heatmap'
import { StackedOkKoBarChart } from '@/components/instructor/courses/statistics/StackedOkKoBarChart'
import { DistributionPieChart } from '@/components/instructor/statistics/DistributionPieChart'
import { StatisticsChartTableView } from '@/components/instructor/statistics/StatisticsChartTableView'

import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { CardContent, CardHeader, CardTitle, ResizableCard } from '@/components/ResizableCard'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import FloatingToolbar from '@/components/instructor/FloatingToolbar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    fetchAbstractProblem,
    fetchInstructorAnonymousSubmissions,
    fetchInstructorProblemPopularityBuckets,
    fetchMiscHexColors,
    fetchTablesLanguages,
} from '@/lib/instructor/client'
import {
    deriveSubmissionChartData,
    deriveSubmissionsByLanguageOverTime,
    toStatisticsSubmissionFromAnonymous,
    type AttemptsToSolvePoint,
    type StatisticsSubmission,
    type SubmissionsByLanguageOverTimePoint,
    type TimeToFirstPassPoint,
    type VolumeOverTimePoint,
} from '@/lib/instructor/submissionStatistics'
import {
    AbstractProblem,
    ColorMapping,
    Language,
    ProblemAnonymousSubmission,
    ProblemPopularityBucketEntry,
} from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
    BarChart3Icon,
    BugIcon,
    CalendarIcon,
    ChartAreaIcon,
    ChartLineIcon,
    CheckIcon,
    FunnelIcon,
    RotateCcwIcon,
    SendIcon,
    ThumbsDownIcon,
    UsersIcon,
    XIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useId, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'

dayjs.extend(customParseFormat)

const DATE_FORMAT = 'YYYY-MM-DD'
const CALENDAR_START_MONTH = new Date(2000, 0)
const CALENDAR_END_MONTH = new Date(new Date().getFullYear() + 1, 11)

function formatDateValue(date: Date | undefined): string {
    return date && dayjs(date).isValid() ? dayjs(date).format(DATE_FORMAT) : ''
}

function getCategoryColor(key: string, category: string, colors: ColorMapping): string {
    if (!(category in colors) || !(key in colors[category])) {
        return 'hsl(var(--chart-1))'
    }
    return colors[category][key]
}

// -----------------------------------------------------------------------------
// Statistics dashboard card (top summary)
// -----------------------------------------------------------------------------

type DashboardStats = {
    totalSubmissions: number
    totalUsers: number
    passRatePct: number
    passedCount: number
    neverPassed: number
    seCount: number
}

const summaryStatItems = [
    {
        key: 'submissions' as const,
        label: 'Submissions',
        icon: SendIcon,
        borderAccent: 'border-t-blue-500',
        iconAccent: 'text-blue-600 dark:text-blue-400',
    },
    {
        key: 'users' as const,
        label: 'Users',
        icon: UsersIcon,
        borderAccent: 'border-t-amber-500',
        iconAccent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        key: 'avgSubsPerUser' as const,
        label: 'Avg subs/user',
        icon: BarChart3Icon,
        borderAccent: 'border-t-violet-500',
        iconAccent: 'text-violet-600 dark:text-violet-400',
    },
    {
        key: 'acRate' as const,
        label: 'AC rate',
        icon: CheckIcon,
        borderAccent: 'border-t-emerald-500',
        iconAccent: 'text-amber-600 dark:text-amber-400',
    },
    {
        key: 'fails' as const,
        label: 'Fails',
        icon: ThumbsDownIcon,
        borderAccent: 'border-t-red-500',
        iconAccent: 'text-red-600 dark:text-red-400',
    },
    {
        key: 'setterErrors' as const,
        label: 'Setter errors',
        icon: BugIcon,
        borderAccent: 'border-t-orange-500',
        iconAccent: 'text-orange-600 dark:text-orange-400',
    },
]

function formatSummaryStatValue(key: (typeof summaryStatItems)[number]['key'], stats: DashboardStats): string {
    const totalUsers = stats.totalUsers
    switch (key) {
        case 'submissions':
            return stats.totalSubmissions.toLocaleString()
        case 'users':
            return stats.totalUsers.toLocaleString()
        case 'avgSubsPerUser':
            return totalUsers > 0 ? (stats.totalSubmissions / totalUsers).toFixed(1) : '—'
        case 'acRate':
            return totalUsers > 0 ? `${Math.round(stats.passRatePct)}%` : '0%'
        case 'fails':
            return stats.neverPassed.toLocaleString()
        case 'setterErrors':
            return stats.seCount.toLocaleString()
    }
}

function StatisticsDashboardCard({ stats }: { stats: DashboardStats }) {
    return (
        <section
            aria-label="Problem statistics summary"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
            {summaryStatItems.map(({ key, label, icon: Icon, borderAccent, iconAccent }) => (
                <div
                    key={key}
                    className={cn(
                        'flex flex-col gap-3 rounded-2xl border border-border border-t-4 bg-card px-5 py-5 shadow-sm',
                        borderAccent,
                        key === 'setterErrors' && stats.seCount > 4 && 'border-t-red-500',
                    )}
                >
                    <div className="flex items-center justify-between gap-3">
                        <Icon
                            className={cn(
                                'size-10 shrink-0 opacity-80',
                                iconAccent,
                                key === 'setterErrors' && stats.seCount > 4 && 'text-red-600 dark:text-red-400',
                            )}
                            aria-hidden
                        />
                        <p
                            className={cn(
                                'text-3xl font-semibold tracking-tight tabular-nums text-foreground',
                                key === 'setterErrors' && stats.seCount > 4 && 'text-red-600 dark:text-red-400',
                            )}
                        >
                            {formatSummaryStatValue(key, stats)}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'text-right text-sm font-medium text-muted-foreground',
                            key === 'setterErrors' &&
                                stats.seCount > 4 &&
                                'font-semibold text-red-600 dark:text-red-400',
                        )}
                    >
                        {label}
                    </span>
                </div>
            ))}
        </section>
    )
}

// -----------------------------------------------------------------------------
// Chart components
// -----------------------------------------------------------------------------

function DatePickerField({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string
    value: Date
    onChange: (d: Date | undefined) => void
    disabled?: boolean
}) {
    const inputId = useId()
    const [open, setOpen] = useState(false)
    const [month, setMonth] = useState<Date | undefined>(value)
    const [inputValue, setInputValue] = useState(() => formatDateValue(value))

    useEffect(() => {
        setInputValue(formatDateValue(value))
        if (value && dayjs(value).isValid()) setMonth(value)
    }, [value])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value
        setInputValue(text)
        const parsed = dayjs(text, DATE_FORMAT, true)
        if (parsed.isValid()) {
            const date = parsed.toDate()
            onChange(date)
            setMonth(date)
        }
    }

    const handleCalendarSelect = (date: Date | undefined) => {
        onChange(date)
        if (date) {
            setInputValue(formatDateValue(date))
            setMonth(date)
        }
        setOpen(false)
    }

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-sm font-medium text-muted-foreground">
                {label}
            </label>
            <div className="relative">
                <Input
                    id={inputId}
                    value={inputValue}
                    placeholder={DATE_FORMAT}
                    disabled={disabled}
                    className="w-[160px] pr-9"
                    onChange={handleInputChange}
                    onBlur={() => setInputValue(formatDateValue(value))}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                            event.preventDefault()
                            setOpen(true)
                        }
                    }}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={disabled}
                                        aria-label={`Open ${label.toLowerCase()} calendar`}
                                        className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Open calendar</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={value}
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={handleCalendarSelect}
                            captionLayout="dropdown"
                            startMonth={CALENDAR_START_MONTH}
                            endMonth={CALENDAR_END_MONTH}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

type StatisticsSettingsDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    abstractProblem: AbstractProblem
    selectedProblemIds: Set<string>
    startDate: Date
    endDate: Date
    defaultStartDate: Date
    defaultEndDate: Date
    onAccept: (selectedProblemIds: Set<string>, startDate: Date, endDate: Date) => void
}

function StatisticsSettingsDialog({
    open,
    onOpenChange,
    abstractProblem,
    selectedProblemIds,
    startDate,
    endDate,
    defaultStartDate,
    defaultEndDate,
    onAccept,
}: StatisticsSettingsDialogProps) {
    const problems = Object.values(abstractProblem.problems)

    const [draftSelectedProblemIds, setDraftSelectedProblemIds] = useState<Set<string>>(
        () => new Set(selectedProblemIds),
    )
    const [draftStartDate, setDraftStartDate] = useState<Date>(() => startDate)
    const [draftEndDate, setDraftEndDate] = useState<Date>(() => endDate)

    useEffect(() => {
        if (open) {
            setDraftSelectedProblemIds(new Set(selectedProblemIds))
            setDraftStartDate(startDate)
            setDraftEndDate(endDate)
        }
    }, [open, selectedProblemIds, startDate, endDate])

    const handleResetDraft = () => {
        setDraftSelectedProblemIds(new Set(problems.map((p) => p.problem_id)))
        setDraftStartDate(defaultStartDate)
        setDraftEndDate(defaultEndDate)
    }

    const handleAccept = () => {
        onAccept(draftSelectedProblemIds, draftStartDate, draftEndDate)
        onOpenChange(false)
    }

    return (
        <FloatingToolbar>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                    <Button
                        size="icon"
                        variant="default"
                        className="h-14 w-14 rounded-full"
                        aria-label="Open statistics period settings"
                    >
                        <FunnelIcon className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Statistics settings</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Problems</span>
                            <div className="flex flex-col gap-2 text-sm">
                                {problems
                                    .sort((a, b) => a.problem_id.localeCompare(b.problem_id))
                                    .map((p) => (
                                        <span key={p.problem_id} className="flex items-center gap-4">
                                            <Switch
                                                checked={draftSelectedProblemIds.has(p.problem_id)}
                                                onCheckedChange={(checked) =>
                                                    setDraftSelectedProblemIds((prev) => {
                                                        const next = new Set(prev)
                                                        if (checked) next.add(p.problem_id)
                                                        else next.delete(p.problem_id)
                                                        return next
                                                    })
                                                }
                                                aria-label={`Include ${p.problem_id} in statistics`}
                                            />
                                            <span className="font-medium text-foreground w-20">{p.problem_id}</span>
                                            <span className="max-w-[200px] truncate sm:max-w-none" title={p.title}>
                                                {p.title}
                                            </span>
                                        </span>
                                    ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                            <DatePickerField
                                label="Start date"
                                value={draftStartDate}
                                onChange={(d) => d != null && setDraftStartDate(d)}
                            />
                            <DatePickerField
                                label="End date"
                                value={draftEndDate}
                                onChange={(d) => d != null && setDraftEndDate(d)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col gap-0">
                        <Button variant="outline" onClick={handleResetDraft} className="w-full">
                            <RotateCcwIcon className="h-4 w-4" />
                            Reset
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full">
                                <XIcon className="h-4 w-4" />
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button onClick={handleAccept} className="w-full">
                            <CheckIcon className="h-4 w-4" />
                            Accept
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FloatingToolbar>
    )
}

function StatCard({
    title,
    children,
    defaultHeight = 360,
}: {
    title: string
    children: React.ReactNode
    defaultHeight?: number
}) {
    return (
        <ResizableCard className="w-full" defaultHeight={defaultHeight}>
            <CardHeader className="p-4">
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-0">{children}</CardContent>
        </ResizableCard>
    )
}

type TimeToFirstPassFunnelProps = {
    curve: TimeToFirstPassPoint[]
    totalSolvers: number
    neverSolved: number
    medianHours: number | null
    exportFileName: string
}

function formatTimeToSolveLabel(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)} min`
    if (hours < 24) return `${hours} h`
    return `${(hours / 24).toFixed(1)} days`
}

function TimeToFirstPassFunnelChart({
    curve,
    totalSolvers,
    neverSolved,
    medianHours,
    exportFileName,
}: TimeToFirstPassFunnelProps) {
    const chartConfig = {
        hours: { label: 'Time since first submission', color: 'hsl(var(--muted-foreground))' },
        cumulativePct: { label: 'Cumulative % solved', color: 'hsl(var(--chart-1))' },
    }
    const formatPct = (value: unknown) => [`${Number(value).toFixed(1)}%`, 'Solved by this time'] as [string, string]
    const formatTimeLabel = (label: unknown) => formatTimeToSolveLabel(Number(label))
    const csvRecords = useMemo(
        () =>
            curve.map((point) => ({
                'Time since first submission': formatTimeToSolveLabel(point.hours),
                'Cumulative % solved': point.cumulativePct,
            })),
        [curve],
    )
    const table = (
        <ScrollArea className="h-[200px] w-full">
            <Table>
                <TableBody>
                    {curve.map((point) => (
                        <TableRow key={point.hours}>
                            <TableCell>{formatTimeToSolveLabel(point.hours)}</TableCell>
                            <TableCell className="text-end">{point.cumulativePct.toFixed(1)}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )
    return (
        <>
            <StatisticsChartTableView
                exportFileName={exportFileName}
                csvRecords={csvRecords}
                hasData={curve.length > 0}
                table={table}
                chartToggleIcon={ChartLineIcon}
                showChartLabel="line chart"
            >
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <LineChart data={curve} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="hours"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(h: number) =>
                                h < 1 ? `${Math.round(h * 60)}m` : h < 24 ? `${h}h` : `${h / 24}d`
                            }
                        />
                        <YAxis
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `${v}%`}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent formatter={formatPct} labelFormatter={formatTimeLabel} />}
                        />
                        <Line
                            type="monotone"
                            dataKey="cumulativePct"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={4}
                            dot={false}
                            connectNulls
                        />
                    </LineChart>
                </ChartContainer>
            </StatisticsChartTableView>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {totalSolvers > 0 && (
                    <>
                        <span>Solvers: {totalSolvers}</span>
                        {neverSolved > 0 && <span>Never solved: {neverSolved}</span>}
                        {medianHours != null && (
                            <span>
                                Median time-to-solve:{' '}
                                {medianHours < 1
                                    ? `${Math.round(medianHours * 60)} min`
                                    : medianHours < 24
                                      ? `${medianHours.toFixed(1)} h`
                                      : `${(medianHours / 24).toFixed(1)} days`}
                            </span>
                        )}
                    </>
                )}
                {totalSolvers === 0 && <span>No solvers yet</span>}
            </div>
        </>
    )
}

type AttemptsToSolveChartProps = {
    histogram: AttemptsToSolvePoint[]
    medianAttempts: number | null
    totalPassed: number
    neverPassedCount: number
    colors: ColorMapping
    exportFileName: string
}

function AttemptsToSolveChart({
    histogram,
    medianAttempts,
    totalPassed,
    neverPassedCount,
    colors,
    exportFileName,
}: AttemptsToSolveChartProps) {
    const chartConfig = {
        label: { label: 'Attempts', color: 'hsl(var(--muted-foreground))' },
        passed: {
            label: 'Passed (AC)',
            color: getCategoryColor('OK', 'statuses', colors),
        },
        neverPassed: {
            label: 'Did not pass',
            color: getCategoryColor('KO', 'statuses', colors),
        },
    }
    const formatCount = (value: unknown) => [String(value), 'Students'] as [string, string]
    const csvRecords = useMemo(
        () =>
            histogram.map((row) => ({
                Attempts: row.label,
                Passed: row.passed,
                'Did not pass': row.neverPassed ?? 0,
            })),
        [histogram],
    )
    const table = (
        <ScrollArea className="h-[200px] w-full">
            <Table>
                <TableBody>
                    {histogram.map((row) => (
                        <TableRow key={row.label}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell className="text-end">{row.passed}</TableCell>
                            <TableCell className="text-end">{row.neverPassed ?? 0}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )
    return (
        <>
            <StatisticsChartTableView
                exportFileName={exportFileName}
                csvRecords={csvRecords}
                hasData={histogram.some((row) => row.passed + (row.neverPassed ?? 0) > 0)}
                table={table}
            >
                <div className="flex w-full items-stretch gap-1">
                    <div className="flex w-[1.125rem] shrink-0 items-center justify-center self-stretch sm:w-5">
                        <span className="whitespace-nowrap text-xs text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                            Number of students
                        </span>
                    </div>
                    <ChartContainer config={chartConfig} className="h-[200px] min-w-0 flex-1">
                        <BarChart
                            data={histogram}
                            margin={{ top: 32, right: 8, bottom: 8, left: 4 }}
                            barCategoryGap="10%"
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                label={{
                                    value: 'Attempts to first AC',
                                    position: 'insideBottom',
                                    offset: -4,
                                }}
                            />
                            <YAxis tickLine={false} axisLine={false} width={48} tickMargin={8} />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        formatter={formatCount}
                                        labelFormatter={(label) => `Attempts: ${label}`}
                                    />
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
                                        offset: 4,
                                    }}
                                />
                            )}
                            <Bar
                                dataKey="passed"
                                fill="var(--color-passed)"
                                stackId="a"
                                radius={[0, 0, 4, 4]}
                                name="Passed (AC)"
                            />
                            <Bar
                                dataKey="neverPassed"
                                fill="var(--color-neverPassed)"
                                stackId="a"
                                radius={[4, 4, 0, 0]}
                                name="Did not pass"
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            </StatisticsChartTableView>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {totalPassed > 0 && (
                    <>
                        <span>Solvers: {totalPassed}</span>
                        {neverPassedCount > 0 && <span>Did not pass: {neverPassedCount}</span>}
                        {medianAttempts != null && <span>Median attempts to solve: {medianAttempts}</span>}
                    </>
                )}
                {totalPassed === 0 && neverPassedCount === 0 && <span>No submissions yet</span>}
                {totalPassed === 0 && neverPassedCount > 0 && (
                    <span>No solvers yet ({neverPassedCount} attempted)</span>
                )}
            </div>
        </>
    )
}

type SubmissionVolumeAreaChartProps = {
    data: VolumeOverTimePoint[]
    colors: ColorMapping
    exportFileName: string
}

function SubmissionVolumeAreaChart({ data, colors, exportFileName }: SubmissionVolumeAreaChartProps) {
    const chartConfig = {
        year: { label: 'Year', color: 'hsl(var(--muted-foreground))' },
        ok: {
            label: 'OK (AC)',
            color: getCategoryColor('OK', 'statuses', colors),
        },
        ko: {
            label: 'KO',
            color: getCategoryColor('KO', 'statuses', colors),
        },
    }
    const formatCount = (value: unknown) => [String(value), 'Submissions'] as [string, string]
    const csvRecords = useMemo(
        () =>
            data.map((row) => ({
                Year: row.year,
                OK: row.ok,
                KO: row.ko,
                Total: row.ok + row.ko,
            })),
        [data],
    )
    const table = (
        <ScrollArea className="h-[200px] w-full">
            <Table>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.year}>
                            <TableCell>{row.year}</TableCell>
                            <TableCell className="text-end">{row.ok}</TableCell>
                            <TableCell className="text-end">{row.ko}</TableCell>
                            <TableCell className="text-end">{row.ok + row.ko}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )
    const chart =
        data.length === 0 ? (
            <div className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No submission data
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tickFormatter={(y: number) => String(y)} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
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
                        name="OK (AC)"
                    />
                    <Area
                        type="monotone"
                        dataKey="ko"
                        stackId="a"
                        stroke="var(--color-ko)"
                        fill="var(--color-ko)"
                        fillOpacity={0.6}
                        name="KO"
                    />
                </AreaChart>
            </ChartContainer>
        )
    return (
        <StatisticsChartTableView
            exportFileName={exportFileName}
            csvRecords={csvRecords}
            hasData={data.some((row) => row.ok + row.ko > 0)}
            table={table}
            chartToggleIcon={ChartAreaIcon}
            showChartLabel="area chart"
        >
            {chart}
        </StatisticsChartTableView>
    )
}

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
] as const

type SubmissionsByLanguageChartProps = {
    data: SubmissionsByLanguageOverTimePoint[]
    languageIds: string[]
    languageNames: Record<string, string>
    exportFileName: string
}

function SubmissionsByLanguageChart({
    data,
    languageIds,
    languageNames,
    exportFileName,
}: SubmissionsByLanguageChartProps) {
    const chartConfig = useMemo(() => {
        const config: Record<string, { label: string; color: string }> = {
            year: { label: 'Year', color: 'hsl(var(--muted-foreground))' },
        }
        languageIds.forEach((lid, i) => {
            config[lid] = {
                label: languageNames[lid] ?? lid,
                color: CHART_COLORS[i % CHART_COLORS.length],
            }
        })
        return config
    }, [languageIds, languageNames])
    const csvRecords = useMemo(
        () =>
            data.map((row) => {
                const record: Record<string, unknown> = { Year: row.year }
                for (const languageId of languageIds) {
                    record[languageNames[languageId] ?? languageId] = row[languageId] ?? 0
                }
                return record
            }),
        [data, languageIds, languageNames],
    )
    const table = (
        <ScrollArea className="h-[200px] w-full">
            <Table>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.year}>
                            <TableCell>{row.year}</TableCell>
                            {languageIds.map((languageId) => (
                                <TableCell key={languageId} className="text-end">
                                    {row[languageId] ?? 0}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )
    const chart =
        data.length === 0 ? (
            <div className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No submission data by language
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
                <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} tickFormatter={(y: number) => String(y)} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    const p = payload?.[0]?.payload as SubmissionsByLanguageOverTimePoint | undefined
                                    return p ? `Year ${p.year}` : ''
                                }}
                            />
                        }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {languageIds.map((lid, i) => (
                        <Line
                            key={lid}
                            type="monotone"
                            dataKey={lid}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name={languageNames[lid] ?? lid}
                        />
                    ))}
                </LineChart>
            </ChartContainer>
        )
    return (
        <StatisticsChartTableView
            exportFileName={exportFileName}
            csvRecords={csvRecords}
            hasData={data.length > 0}
            table={table}
            chartToggleIcon={ChartLineIcon}
            showChartLabel="line chart"
        >
            {chart}
        </StatisticsChartTableView>
    )
}

/** X-axis tick: logarithmic scale as 2^0, 2^1, 2^2, … (plus 0 and open-ended tail). */
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

/** Bucket row for chart (X = 2^k scale, Y = how many problems fall in that range). */
function buildPopularityChartData(buckets: ProblemPopularityBucketEntry[]) {
    return [...buckets]
        .sort((a, b) => a.bucket_min - b.bucket_min)
        .map((b) => ({
            label: formatPopularityBucketPowerLabel(b),
            problem_count: b.problem_count,
        }))
}

/** Label of the bucket where this problem's submission count falls (half-open [min, max), last bucket inclusive). */
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

type ProblemPopularityChartProps = {
    buckets: ProblemPopularityBucketEntry[]
    problemTotalSubmissions: number
    exportFileName: string
}

function ProblemPopularityChart({ buckets, problemTotalSubmissions, exportFileName }: ProblemPopularityChartProps) {
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
    const csvRecords = useMemo(
        () =>
            chartData.map((row) => ({
                Bucket: row.label,
                Problems: row.problem_count,
            })),
        [chartData],
    )
    const table = (
        <ScrollArea className="h-[240px] w-full">
            <Table>
                <TableBody>
                    {chartData.map((row) => (
                        <TableRow key={row.label}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell className="text-end">{row.problem_count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )
    const chart =
        chartData.length === 0 ? (
            <div className="flex h-[240px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No popularity data
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full aspect-auto">
                <BarChart data={chartData} margin={{ top: 28, right: 12, bottom: 56, left: 48 }} barCategoryGap="12%">
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tick={{ fontSize: 10 }}
                        angle={-35}
                        textAnchor="end"
                        height={52}
                        label={{
                            value: 'Submissions per problem (2^k scale)',
                            position: 'insideBottom',
                            offset: -2,
                            style: { fontSize: 11 },
                        }}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        allowDecimals={false}
                        label={{
                            value: 'Number of problems',
                            angle: -90,
                            position: 'insideLeft',
                            style: { textAnchor: 'middle' },
                        }}
                    />
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
                                value: 'This problem',
                                position: 'top',
                                fill: 'hsl(var(--chart-3))',
                                fontSize: 11,
                            }}
                        />
                    )}
                    <Bar
                        dataKey="problem_count"
                        fill="var(--color-problem_count)"
                        radius={[4, 4, 0, 0]}
                        name="Problems in bucket"
                    />
                </BarChart>
            </ChartContainer>
        )
    return (
        <StatisticsChartTableView
            exportFileName={exportFileName}
            csvRecords={csvRecords}
            hasData={chartData.some((row) => row.problem_count > 0)}
            table={table}
        >
            {chart}
        </StatisticsChartTableView>
    )
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export type ProblemStatisticsPanelProps = {
    problem_nm: string
    submissions: StatisticsSubmission[]
    colors: ColorMapping
    abstractProblem: AbstractProblem
    languagesTable: Record<string, Language>
    popularityBuckets?: ProblemPopularityBucketEntry[]
    problemTotalSubmissionsAllTime?: number
}

export function ProblemStatisticsPanel({
    problem_nm,
    submissions,
    colors,
    abstractProblem,
    languagesTable,
    popularityBuckets,
    problemTotalSubmissionsAllTime,
}: ProblemStatisticsPanelProps) {
    const [selectedProblemIds, setSelectedProblemIds] = useState<Set<string>>(
        () => new Set(Object.values(abstractProblem.problems).map((p) => p.problem_id)),
    )
    const defaultStartDate = useMemo(() => {
        if (submissions.length === 0) return dayjs().startOf('day').toDate()
        const sorted = [...submissions].sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf())
        return dayjs(sorted[0].time).startOf('day').toDate()
    }, [submissions])
    const defaultEndDate = useMemo(() => dayjs().startOf('day').toDate(), [])
    // Session-only: remembered across dialog opens, reset when this view unmounts.
    const [startDate, setStartDate] = useState(defaultStartDate)
    const [endDate, setEndDate] = useState(defaultEndDate)
    const [settingsOpen, setSettingsOpen] = useState(false)

    const filteredSubmissions = useMemo(() => {
        const start = dayjs(startDate).startOf('day')
        const end = dayjs(endDate).endOf('day')
        return submissions.filter((s) => {
            const t = dayjs(s.time)
            const inRange = !t.isBefore(start) && !t.isAfter(end)
            const selected = selectedProblemIds.has(s.problem_id)
            return inRange && selected
        })
    }, [submissions, startDate, endDate, selectedProblemIds])

    const submissionsByDateOnly = useMemo(() => {
        const start = dayjs(startDate).startOf('day')
        const end = dayjs(endDate).endOf('day')
        return submissions.filter((s) => {
            const t = dayjs(s.time)
            return !t.isBefore(start) && !t.isAfter(end)
        })
    }, [submissions, startDate, endDate])

    const derived = useMemo(() => deriveSubmissionChartData(filteredSubmissions), [filteredSubmissions])

    const submissionsByLanguageOverTime = useMemo(
        () => deriveSubmissionsByLanguageOverTime(problem_nm, submissionsByDateOnly, languagesTable),
        [problem_nm, submissionsByDateOnly, languagesTable],
    )

    const totalUsers = derived.usersOkKo.OK + derived.usersOkKo.KO
    const dashboardStats: DashboardStats = {
        totalSubmissions: filteredSubmissions.length,
        totalUsers,
        passRatePct: totalUsers > 0 ? (derived.usersOkKo.OK / totalUsers) * 100 : 0,
        passedCount: derived.usersOkKo.OK,
        neverPassed: derived.usersOkKo.KO,
        seCount: filteredSubmissions.filter((s) => s.verdict === 'SE').length,
    }

    const handleAcceptSettings = (ids: Set<string>, start: Date, end: Date) => {
        setSelectedProblemIds(ids)
        setStartDate(start)
        setEndDate(end)
    }

    return (
        <div className="flex w-full flex-col gap-4">
            <StatisticsDashboardCard stats={dashboardStats} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <StatCard title="User statuses">
                    <DistributionPieChart
                        data={derived.usersOkKo}
                        category="statuses"
                        colors={colors}
                        exportFileName={`${problem_nm}-user-statuses`}
                    />
                </StatCard>
                <StatCard title="Submission statuses">
                    <DistributionPieChart
                        data={derived.submissionsOkKo}
                        category="statuses"
                        colors={colors}
                        exportFileName={`${problem_nm}-submission-statuses`}
                    />
                </StatCard>
                <StatCard title="Submissions by verdict">
                    <DistributionPieChart
                        data={derived.verdicts}
                        category="verdicts"
                        colors={colors}
                        exportFileName={`${problem_nm}-verdicts`}
                    />
                </StatCard>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <StatCard title="Compilers">
                    <DistributionPieChart
                        data={derived.compilers}
                        category="compilers"
                        colors={colors}
                        exportFileName={`${problem_nm}-compilers`}
                    />
                </StatCard>
                <StatCard title="Programming languages">
                    <DistributionPieChart
                        data={derived.proglangs}
                        category="proglangs"
                        colors={colors}
                        exportFileName={`${problem_nm}-programming-languages`}
                    />
                </StatCard>
            </div>
            <div
                className={
                    popularityBuckets !== undefined && problemTotalSubmissionsAllTime !== undefined
                        ? 'grid grid-cols-1 lg:grid-cols-3 gap-4'
                        : 'grid grid-cols-1 lg:grid-cols-2 gap-4'
                }
            >
                {popularityBuckets !== undefined && problemTotalSubmissionsAllTime !== undefined && (
                    <ResizableCard className="w-full" defaultHeight={420}>
                        <CardHeader className="p-4">
                            <CardTitle>Problem popularity</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                The more to the right, the more submissions the problem has and more popular it is.
                            </p>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <ProblemPopularityChart
                                buckets={popularityBuckets}
                                problemTotalSubmissions={problemTotalSubmissionsAllTime}
                                exportFileName={`${problem_nm}-popularity`}
                            />
                        </CardContent>
                    </ResizableCard>
                )}

                <ResizableCard className="w-full" defaultHeight={420}>
                    <CardHeader className="p-4">
                        <CardTitle>Attempts to solve</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Curve shows how many tries it took each student to get AC.
                        </p>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <AttemptsToSolveChart
                            histogram={derived.attemptsToSolve.histogram}
                            medianAttempts={derived.attemptsToSolve.medianAttempts}
                            totalPassed={derived.attemptsToSolve.totalPassed}
                            neverPassedCount={derived.attemptsToSolve.neverPassedCount}
                            colors={colors}
                            exportFileName={`${problem_nm}-attempts-to-solve`}
                        />
                    </CardContent>
                </ResizableCard>
                <ResizableCard className="w-full" defaultHeight={420}>
                    <CardHeader className="p-4">
                        <CardTitle>Time to solve</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Cumulative % of students who had AC by a given time since their first submission. Students
                            who never passed are excluded from the curve.
                        </p>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <TimeToFirstPassFunnelChart
                            curve={derived.timeToFirstPass.curve}
                            totalSolvers={derived.timeToFirstPass.totalSolvers}
                            neverSolved={derived.timeToFirstPass.neverSolved}
                            medianHours={derived.timeToFirstPass.medianHours}
                            exportFileName={`${problem_nm}-time-to-solve`}
                        />
                    </CardContent>
                </ResizableCard>
            </div>
            <ResizableCard className="w-full" defaultHeight={340}>
                <CardHeader className="p-4">
                    <CardTitle>Submissions by day</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <Heatmap
                        data={derived.heatmapData}
                        start={dayjs(startDate).startOf('day')}
                        end={dayjs(endDate).startOf('day').add(1, 'day')}
                        maxValue={derived.maxValue}
                    />
                </CardContent>
            </ResizableCard>
            <ResizableCard className="w-full" defaultHeight={340}>
                <CardHeader className="p-4">
                    <CardTitle>Submission over time</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <SubmissionVolumeAreaChart
                        data={derived.submissionVolumeOverTime}
                        colors={colors}
                        exportFileName={`${problem_nm}-submissions-over-time`}
                    />
                </CardContent>
            </ResizableCard>
            {Object.values(abstractProblem.problems).length > 1 && (
                <ResizableCard className="w-full" defaultHeight={340}>
                    <CardHeader className="p-4">
                        <CardTitle>Submissions by language</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <SubmissionsByLanguageChart
                            data={submissionsByLanguageOverTime.data}
                            languageIds={submissionsByLanguageOverTime.languageIds}
                            languageNames={submissionsByLanguageOverTime.languageNames}
                            exportFileName={`${problem_nm}-submissions-by-language`}
                        />
                    </CardContent>
                </ResizableCard>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <StatCard title="Submissions by year">
                    <StackedOkKoBarChart
                        data={derived.submissionsByYear}
                        colors={colors}
                        exportFileName={`${problem_nm}-submissions-by-year`}
                    />
                </StatCard>
                <StatCard title="Submissions by month of year">
                    <StackedOkKoBarChart
                        data={derived.submissionsByMonth}
                        colors={colors}
                        exportFileName={`${problem_nm}-submissions-by-month`}
                    />
                </StatCard>
                <StatCard title="Submissions by day of week">
                    <StackedOkKoBarChart
                        data={derived.submissionsByWeekday}
                        colors={colors}
                        exportFileName={`${problem_nm}-submissions-by-day-of-week`}
                    />
                </StatCard>
                <StatCard title="Submissions by hour of day">
                    <StackedOkKoBarChart
                        data={derived.submissionsByHour}
                        colors={colors}
                        exportFileName={`${problem_nm}-submissions-by-hour-of-day`}
                    />
                </StatCard>
            </div>
            <StatisticsSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                abstractProblem={abstractProblem}
                selectedProblemIds={selectedProblemIds}
                startDate={startDate}
                endDate={endDate}
                defaultStartDate={defaultStartDate}
                defaultEndDate={defaultEndDate}
                onAccept={handleAcceptSettings}
            />
        </div>
    )
}

export function ProblemStatisticsView() {
    const { problem_nm } = useParams<{ problem_nm: string }>()
    const [statistics, setStatistics] = useState<{
        submissions: ProblemAnonymousSubmission[]
    } | null>(null)
    const [colors, setColors] = useState<ColorMapping | null>(null)
    const [languagesTable, setLanguagesTable] = useState<Record<string, Language> | null>(null)
    const [abstractProblem, setAbstractProblem] = useState<AbstractProblem | null>(null)
    const [popularityBuckets, setPopularityBuckets] = useState<ProblemPopularityBucketEntry[] | null>(null)

    useEffect(() => {
        async function fetchData() {
            const [submissions, colorMap, languages, abstract, buckets] = await Promise.all([
                fetchInstructorAnonymousSubmissions(problem_nm),
                fetchMiscHexColors(),
                fetchTablesLanguages(),
                fetchAbstractProblem(problem_nm),
                fetchInstructorProblemPopularityBuckets(),
            ])
            setStatistics({ submissions })
            setColors(colorMap)
            setLanguagesTable(languages)
            setAbstractProblem(abstract)
            setPopularityBuckets(buckets)
        }
        fetchData()
    }, [problem_nm])

    const normalizedSubmissions = useMemo(
        () => (statistics?.submissions ?? []).map(toStatisticsSubmissionFromAnonymous),
        [statistics],
    )

    if (
        statistics === null ||
        colors === null ||
        abstractProblem === null ||
        languagesTable === null ||
        popularityBuckets === null
    ) {
        return <SimpleSpinner size={64} className="pt-24" />
    }

    return (
        <ProblemStatisticsPanel
            key={problem_nm}
            problem_nm={problem_nm}
            submissions={normalizedSubmissions}
            colors={colors}
            abstractProblem={abstractProblem}
            languagesTable={languagesTable}
            popularityBuckets={popularityBuckets}
            problemTotalSubmissionsAllTime={statistics.submissions.length}
        />
    )
}
