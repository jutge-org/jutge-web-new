'use client'

import { StatisticsChartTableView } from '@/components/instructor/statistics/StatisticsChartTableView'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCategoryColor, type VolumeOverTimePoint } from '@/lib/instructor/courseSubmissionStatistics'
import type { ColorMapping } from '@/lib/jutge_api_client'
import { ChartAreaIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type SubmissionVolumeAreaChartProps = {
    data: VolumeOverTimePoint[]
    colors: ColorMapping
    exportFileName: string
}

export function SubmissionVolumeAreaChart({ data, colors, exportFileName }: SubmissionVolumeAreaChartProps) {
    const chartConfig = {
        label: { label: 'Period', color: 'hsl(var(--muted-foreground))' },
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

    const hasData = data.some((row) => row.ok + row.ko > 0)

    const csvRecords = useMemo(
        () =>
            data.map((row) => ({
                Period: row.label,
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
                        <TableRow key={row.key}>
                            <TableCell>{row.label}</TableCell>
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
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                formatter={formatCount}
                                labelFormatter={(_, payload) => {
                                    const p = payload?.[0]?.payload as VolumeOverTimePoint | undefined
                                    return p?.label ?? ''
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
            hasData={hasData}
            table={table}
            chartToggleIcon={ChartAreaIcon}
        >
            {chart}
        </StatisticsChartTableView>
    )
}
