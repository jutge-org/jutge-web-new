'use client'

import { StatisticsSaveButtonGroup } from '@/components/instructor/statistics/StatisticsSaveButtonGroup'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getCategoryColor } from '@/lib/instructor/courseSubmissionStatistics'
import type { ColorMapping, Distribution } from '@/lib/jutge_api_client'
import { saveStatisticsCsv, saveStatisticsSvg } from '@/lib/saveStatisticsExport'
import { cn } from '@/lib/utils'
import { ChartPieIcon, TableIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { LabelList, Pie, PieChart } from 'recharts'

/** Pie chart: slices below this percentage are grouped into "Others". */
const MIN_PERCENT_FOR_PIE_LABEL = 5

type DistributionPieChartProps = {
    data: Distribution
    category: string
    colors: ColorMapping
    exportFileName: string
}

/** Pie/table toggle; small slices (< MIN_PERCENT_FOR_PIE_LABEL) are grouped as "Others". */
export function DistributionPieChart({ data, category, colors, exportFileName }: DistributionPieChartProps) {
    const [chartVisible, setChartVisible] = useState(true)
    const chartContainerRef = useRef<HTMLDivElement>(null)
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
        if (dataClone[key] < MIN_PERCENT_FOR_PIE_LABEL) {
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
        .filter(([, value]) => value >= MIN_PERCENT_FOR_PIE_LABEL)
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

    const tableTotal = Object.values(data).reduce((s, n) => s + n, 0)
    const hasData = tableTotal > 0

    const csvRecords = useMemo(
        () =>
            Object.entries(data)
                .sort((a, b) => b[1] - a[1])
                .map(([key, value]) => ({
                    Label: key,
                    Count: value,
                    Percentage: tableTotal > 0 ? `${((value / tableTotal) * 100).toFixed(1)}%` : '0%',
                })),
        [data, tableTotal],
    )

    async function saveSvgHandle() {
        const svg = chartContainerRef.current?.querySelector('svg')
        await saveStatisticsSvg(svg, `${exportFileName}.svg`)
    }

    async function saveCsvHandle() {
        await saveStatisticsCsv(csvRecords, `${exportFileName}.csv`)
    }

    const chart = (
        <div ref={chartContainerRef}>
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[240px] [&_.recharts-text]:fill-background"
            >
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
                    <Pie data={chartData} dataKey="value" innerRadius={48}>
                        <LabelList
                            dataKey="label"
                            className="fill-background"
                            stroke="none"
                            fontSize={11}
                            formatter={(value) => chartConfig[String(value)]?.label}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>
        </div>
    )
    const table = (
        <ScrollArea className="h-[240px] w-full">
            <Table>
                <TableBody>
                    {Object.entries(data)
                        .sort((a, b) => b[1] - a[1])
                        .map(([key, value]) => (
                            <TableRow key={key}>
                                <TableCell>{key}</TableCell>
                                <TableCell className="text-end">{value}</TableCell>
                                <TableCell className="text-end">
                                    {tableTotal > 0 ? ((value / tableTotal) * 100).toFixed(1) : 0}%
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </ScrollArea>
    )

    return (
        <>
            <div
                className={cn(
                    !chartVisible &&
                        'pointer-events-none fixed top-0 left-[-9999px] size-[240px] overflow-hidden opacity-0',
                )}
                aria-hidden={!chartVisible}
            >
                {chart}
            </div>
            <div className={cn(chartVisible && 'hidden')}>{table}</div>
            <TooltipProvider>
                <div className="mb-2 flex items-center justify-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle
                                variant="outline"
                                className="size-8"
                                pressed={!chartVisible}
                                onPressedChange={(pressed) => setChartVisible(!pressed)}
                                aria-label={chartVisible ? 'Show table' : 'Show pie chart'}
                            >
                                {chartVisible ? (
                                    <ChartPieIcon className="size-4" aria-hidden />
                                ) : (
                                    <TableIcon className="size-4" aria-hidden />
                                )}
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>{chartVisible ? 'Show table' : 'Show pie chart'}</TooltipContent>
                    </Tooltip>
                    <StatisticsSaveButtonGroup
                        onSaveSvg={saveSvgHandle}
                        onSaveCsv={saveCsvHandle}
                        disabled={!hasData}
                    />
                </div>
            </TooltipProvider>
        </>
    )
}
