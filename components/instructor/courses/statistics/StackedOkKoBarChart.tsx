'use client'

import { StatisticsChartTableView } from '@/components/instructor/statistics/StatisticsChartTableView'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCategoryColor, type OkKoPoint } from '@/lib/instructor/courseSubmissionStatistics'
import type { ColorMapping } from '@/lib/jutge_api_client'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type StackedOkKoBarChartProps = {
    data: OkKoPoint[]
    colors: ColorMapping
    exportFileName: string
}

export function StackedOkKoBarChart({ data, colors, exportFileName }: StackedOkKoBarChartProps) {
    const chartConfig = {
        ok: { label: 'OK', color: getCategoryColor('OK', 'statuses', colors) },
        ko: { label: 'KO', color: getCategoryColor('KO', 'statuses', colors) },
    }

    const hasData = data.some((row) => row.ok + row.ko > 0)

    const csvRecords = useMemo(
        () =>
            data.map((row) => ({
                Label: row.label,
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
                        <TableRow key={row.label}>
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

    return (
        <StatisticsChartTableView
            exportFileName={exportFileName}
            csvRecords={csvRecords}
            hasData={hasData}
            table={table}
        >
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="ko" fill="var(--color-ko)" radius={[0, 0, 4, 4]} stackId="a" />
                    <Bar dataKey="ok" fill="var(--color-ok)" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
            </ChartContainer>
        </StatisticsChartTableView>
    )
}
