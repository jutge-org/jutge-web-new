'use client'

import { useEffect, useRef } from 'react'

import { HEATMAP_ROW_LABELS, type HeatmapCell, type HeatmapWeekGrid } from '@/lib/statistics/heatmap'
import { cn } from '@/lib/utils'

const weekdayShort: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
}

// Cell geometry, shared by the day squares and the month label row so both line up.
const CELL_PX = 16
const CELL_GAP_PX = 3
const MONTH_LABEL_PX = 12
/**
 * Room under the last row for the horizontal scrollbar. The years of history are far wider than
 * the card, so that scrollbar always exists; without this allowance it would eat into the grid and
 * clip the bottom row.
 */
const BOTTOM_PAD_PX = 16

/**
 * The calendar's exact height: month labels, then seven day rows. It is fixed and known up front
 * so the card does not resize between the loading placeholder and the loaded grid, and so whatever
 * sits beside it can match its height.
 *
 * It also sets the height of the card next to it on the home dashboard, so it is sized to clear
 * that card's four metric rows (4 × 28px + 3 × 12px gaps = 148px) without scrolling.
 */
export const SUBMISSION_CALENDAR_HEIGHT_PX =
    MONTH_LABEL_PX + CELL_GAP_PX + 7 * CELL_PX + 6 * CELL_GAP_PX + BOTTOM_PAD_PX

function heatColor(value: number, max: number): string {
    if (value === 0) return 'var(--color-muted)'
    const intensity = 0.2 + (value / Math.max(max, 1)) * 0.8
    return `color-mix(in srgb, var(--submission-calendar-heat) ${Math.round(intensity * 100)}%, transparent)`
}

function cellLabel(cell: HeatmapCell): string {
    return `${cell.dateLabel}: ${cell.value} submission${cell.value === 1 ? '' : 's'}`
}

type SubmissionCalendarProps = {
    heatmap: HeatmapWeekGrid
    /** Day key of the selected cell, if any. */
    selectedDay?: number | null
    /** When given, day cells become buttons that report the day they represent. */
    onSelectDay?: (dateTs: number) => void
}

/** GitHub-style submission heatmap, shared by the activity dashboard and the home page. */
export function SubmissionCalendar({ heatmap, selectedDay = null, onSelectDay }: SubmissionCalendarProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const weekCount = heatmap.grid[0]?.length ?? 0

    // The history runs left to right and ends today, so open on the most recent weeks.
    useEffect(() => {
        const element = scrollRef.current
        if (element) {
            element.scrollLeft = element.scrollWidth
        }
    }, [weekCount])

    return (
        <div
            ref={scrollRef}
            // Scrolls sideways through the history; never vertically, the seven rows always fit.
            className="overflow-x-auto overflow-y-hidden"
            style={{ height: SUBMISSION_CALENDAR_HEIGHT_PX, paddingBottom: BOTTOM_PAD_PX }}
        >
            <div className="inline-flex min-w-0 flex-col" style={{ gap: CELL_GAP_PX }}>
                {/* Weekday labels sit on the right, so the month row is padded on that side. */}
                <div className="flex pr-8" style={{ gap: CELL_GAP_PX }}>
                    {heatmap.monthLabels.map((label, index) => (
                        <span
                            key={index}
                            className="text-[10px] font-medium text-muted-foreground"
                            // Explicit line height: the row is part of the fixed height above.
                            style={{
                                width: CELL_PX,
                                minWidth: CELL_PX,
                                height: MONTH_LABEL_PX,
                                lineHeight: `${MONTH_LABEL_PX}px`,
                            }}
                        >
                            {label}
                        </span>
                    ))}
                </div>

                {heatmap.grid.map((row, rowIndex) => (
                    <div key={HEATMAP_ROW_LABELS[rowIndex]} className="flex items-center gap-2">
                        <div className="flex" style={{ gap: CELL_GAP_PX }}>
                            {row.map((cell, colIndex) => (
                                <DayCell
                                    key={colIndex}
                                    cell={cell}
                                    maxValue={heatmap.maxValue}
                                    selected={cell.dateTs !== null && cell.dateTs === selectedDay}
                                    onSelectDay={onSelectDay}
                                />
                            ))}
                        </div>
                        <span className="w-6 shrink-0 text-[10px] text-muted-foreground">
                            {weekdayShort[HEATMAP_ROW_LABELS[rowIndex]!]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DayCell({
    cell,
    maxValue,
    selected,
    onSelectDay,
}: {
    cell: HeatmapCell
    maxValue: number
    selected: boolean
    onSelectDay?: (dateTs: number) => void
}) {
    const sizeStyle = { width: CELL_PX, height: CELL_PX }

    // Padding day after today: keep the column width, draw nothing.
    if (cell.dateTs === null) {
        return <span aria-hidden style={sizeStyle} />
    }

    const background = heatColor(cell.value, maxValue)

    if (!onSelectDay) {
        return (
            <span
                title={cellLabel(cell)}
                className="rounded-sm border border-border/40"
                style={{ ...sizeStyle, backgroundColor: background }}
            />
        )
    }

    return (
        <button
            type="button"
            title={cellLabel(cell)}
            aria-label={cellLabel(cell)}
            aria-pressed={selected}
            onClick={() => onSelectDay(cell.dateTs!)}
            className={cn(
                'rounded-sm border border-border/40 transition-transform hover:scale-125',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'outline outline-2 outline-offset-1 outline-primary',
            )}
            style={{ ...sizeStyle, backgroundColor: background }}
        />
    )
}
