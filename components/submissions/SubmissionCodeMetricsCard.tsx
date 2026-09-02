'use client'

import { GaugeIcon, InfoIcon, TableIcon } from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import { Gauge } from '@/components/Gauge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
    CCN_GAUGE_INTERVALS,
    CODE_METRICS,
    CODE_METRICS_RATIO_HELP,
    DOCUMENTATION_GAUGE_INTERVALS,
    HALSTEAD_DIFFICULTY_GAUGE_INTERVALS,
    MAINTAINABILITY_GAUGE_INTERVALS,
    RATIO_GAUGE_INTERVALS,
    type SubmissionCodeMetricsData,
} from '@/lib/codeMetrics'

type MetricsView = 'gauges' | 'table'

type SubmissionCodeMetricsCardProps = {
    data: SubmissionCodeMetricsData
}

type MetricGaugeProps = {
    value: number
    minimum: number
    maximum: number
    tickInterval: number
    intervals: readonly { minimum: number; maximum: number; color: string }[]
    acronym: string
    name: string
    help: string
}

function MetricGauge({ value, minimum, maximum, tickInterval, intervals, acronym, name, help }: MetricGaugeProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex cursor-help flex-col items-center gap-1" tabIndex={0} aria-label={name}>
                    <div className="border-none rounded-t-full p-2">
                        <Gauge
                            value={value}
                            minimum={minimum}
                            maximum={maximum}
                            tickInterval={tickInterval}
                            intervals={[...intervals]}
                            size={120}
                            title={acronym}
                            textScale={2}
                            handleWidth={4}
                            strokeWidth={18}
                        />
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm space-y-1 text-pretty">
                <p className="font-semibold">
                    {name} ({acronym})
                </p>
                <p>{help}</p>
            </TooltipContent>
        </Tooltip>
    )
}

function MetricsViewToggle({
    label,
    pressed,
    onSelect,
    children,
}: {
    label: string
    pressed: boolean
    onSelect: () => void
    children: ReactNode
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Toggle
                    variant="outline"
                    size="sm"
                    className="size-7 px-0"
                    pressed={pressed}
                    onPressedChange={(nextPressed) => {
                        if (nextPressed) {
                            onSelect()
                        }
                    }}
                    aria-label={label}
                >
                    {children}
                </Toggle>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
    )
}

function CodeMetricsTable({ data }: { data: SubmissionCodeMetricsData }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-left" colSpan={2}>
                        Metric
                    </TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Ref</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.rows.map((row) => (
                    <TableRow key={row.metric}>
                        <TableCell>{row.acronym}</TableCell>
                        <TableCell>{row.metric}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.value}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.ref}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.ratio}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function CodeMetricsGauges({ data }: { data: SubmissionCodeMetricsData }) {
    const hasUserGauges =
        data.cyclomaticComplexity !== null ||
        data.halsteadDifficulty !== null ||
        data.maintainabilityIndex !== null ||
        data.documentationIndex !== null
    const hasRatioGauges = data.ccnRatio !== null || data.difRatio !== null

    return (
        <div className="flex min-w-0 flex-1 flex-wrap items-stretch justify-center gap-x-2 gap-y-6">

            {data.ccnRatio !== null ? (
                <MetricGauge
                    value={data.ccnRatio}
                    minimum={0}
                    maximum={3}
                    tickInterval={0.5}
                    intervals={RATIO_GAUGE_INTERVALS}
                    acronym={CODE_METRICS.ccn.acronym + ' ratio'}
                    name={`${CODE_METRICS.ccn.name} ratio`}
                    help={CODE_METRICS_RATIO_HELP}
                />
            ) : null}
            {data.difRatio !== null ? (
                <MetricGauge
                    value={data.difRatio}
                    minimum={0}
                    maximum={3}
                    tickInterval={0.5}
                    intervals={RATIO_GAUGE_INTERVALS}
                    acronym={CODE_METRICS.dif.acronym + ' ratio'}
                    name={`${CODE_METRICS.dif.name} ratio`}
                    help={CODE_METRICS_RATIO_HELP}
                />
            ) : null}

            {hasUserGauges && hasRatioGauges ? (
                <Separator orientation="vertical" className="mx-4 -my-4" />
            ) : null}

            {data.cyclomaticComplexity !== null ? (
                <MetricGauge
                    value={data.cyclomaticComplexity}
                    minimum={0}
                    maximum={18}
                    tickInterval={3}
                    intervals={CCN_GAUGE_INTERVALS}
                    acronym={CODE_METRICS.ccn.acronym}
                    name={CODE_METRICS.ccn.name}
                    help={CODE_METRICS.ccn.help}
                />
            ) : null}
            {data.halsteadDifficulty !== null ? (
                <MetricGauge
                    value={data.halsteadDifficulty}
                    minimum={0}
                    maximum={30}
                    tickInterval={5}
                    intervals={HALSTEAD_DIFFICULTY_GAUGE_INTERVALS}
                    acronym={CODE_METRICS.dif.acronym}
                    name={CODE_METRICS.dif.name}
                    help={CODE_METRICS.dif.help}
                />
            ) : null}
            {data.maintainabilityIndex !== null ? (
                <MetricGauge
                    value={data.maintainabilityIndex}
                    minimum={0}
                    maximum={100}
                    tickInterval={20}
                    intervals={MAINTAINABILITY_GAUGE_INTERVALS}
                    acronym={CODE_METRICS.mnt.acronym}
                    name={CODE_METRICS.mnt.name}
                    help={CODE_METRICS.mnt.help}
                />
            ) : null}
            {data.documentationIndex !== null ? (
                <MetricGauge
                    value={data.documentationIndex}
                    minimum={0}
                    maximum={100}
                    tickInterval={20}
                    intervals={DOCUMENTATION_GAUGE_INTERVALS}
                    acronym={CODE_METRICS.com.acronym}
                    name={CODE_METRICS.com.name}
                    help={CODE_METRICS.com.help}
                />
            ) : null}
        </div>
    )
}

export function SubmissionCodeMetricsCard({ data }: SubmissionCodeMetricsCardProps) {
    const [view, setView] = useState<MetricsView>('gauges')

    return (
        <Card className="ring-0 border border-border shadow-sm">
            <CardHeader className="border-b border-border">
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">Code metrics</CardTitle>
                <CardAction>
                    <div className="inline-flex items-center gap-2">
                        <ButtonGroup aria-label="Code metrics view">
                            <MetricsViewToggle
                                label="View gauges"
                                pressed={view === 'gauges'}
                                onSelect={() => setView('gauges')}
                            >
                                <GaugeIcon />
                            </MetricsViewToggle>
                            <MetricsViewToggle
                                label="View table"
                                pressed={view === 'table'}
                                onSelect={() => setView('table')}
                            >
                                <TableIcon />
                            </MetricsViewToggle>
                        </ButtonGroup>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon-sm" asChild>
                                    <Link href="/documentation/code-metrics" aria-label="Code metrics documentation">
                                        <InfoIcon />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Learn about code metrics</TooltipContent>
                        </Tooltip>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent className="px-6 py-6">
                {view === 'table' ? <CodeMetricsTable data={data} /> : <CodeMetricsGauges data={data} />}
            </CardContent>
        </Card>
    )
}
