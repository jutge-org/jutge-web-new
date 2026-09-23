'use client'

import { useRef, useEffect } from 'react'
import { HeatmapCalendar } from '@/lib/jutge_api_client'
import dayjs, { Dayjs } from 'dayjs'
import { ReactNode } from 'react'

export interface HeatmapProps {
    data: HeatmapCalendar
    start: Dayjs
    end: Dayjs
    maxValue: number
    sizeFactor?: number
}

export function Heatmap(props: HeatmapProps) {
    //
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
        }
    }, [])

    const sizeFactor = props.sizeFactor || 1
    const width = 10 * sizeFactor
    const height = 10 * sizeFactor
    const top = 52

    const months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
    const days = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')

    const cal: Record<string, number> = {}

    for (const item of props.data) {
        const d = dayjs.unix(item.date)
        if (d.isAfter(props.start) && d.isBefore(props.end)) {
            cal[d.format('YYYY-MM-DD')] = item.value
        }
    }

    const shapes: ReactNode[] = []

    // draw days of week
    for (let dow = 0; dow < 7; dow++) {
        const label = (
            <text
                key={random()}
                x={4 * width}
                y={(dow + 0.5) * (height + 4) + top}
                fill="currentColor"
                fontSize="12"
                textAnchor="end"
                dominantBaseline="middle"
            >
                {days[dow]}
            </text>
        )
        shapes.push(label)
    }

    // draw boxes
    let isFirstMonth = true
    let isFirstYear = true
    let week = 4
    for (let day = props.start; day.isBefore(props.end); day = day.add(1, 'day')) {
        const key = day.format('YYYY-MM-DD')
        const value = cal[key] || 0
        const dow = day.day()

        if (isFirstMonth || day.date() == 1) {
            week += 0.5
            const label = (
                <text key={random()} x={week * (width + 4)} y={top - 10} fill="currentColor" fontSize="12">
                    {months[day.month()]}
                </text>
            )
            shapes.push(label)
            isFirstMonth = false
        }
        if (isFirstYear || (day.date() == 1 && day.month() == 0)) {
            const label = (
                <text key={random()} x={week * (width + 4)} y={top - 24} fill="currentColor" fontSize="12">
                    {day.year()}
                </text>
            )
            shapes.push(label)
            isFirstYear = false
        }

        const x = week * (width + 4)
        const y = dow * (height + 4) + top
        const col = color(value, props.maxValue)
        const rect = (
            <rect
                key={random()}
                x={x + 0.5}
                y={y + 0.5}
                width={width}
                height={height}
                stroke={col}
                strokeWidth="1"
                fill={value === 0 ? 'transparent' : col}
                rx="2"
            >
                <title>{`${key}: ${value}`}</title>
            </rect>
        )
        shapes.push(rect)

        if (dow === 6) week++
    }

    return (
        <div className="w-full overflow-x-auto" ref={scrollRef}>
            <svg width={(week + 2) * (width + 4)} height={8 * (height + 4) + top}>
                {shapes}
            </svg>
        </div>
    )
}

function color(value: number, maxValue: number) {
    const hue = (1 - value / maxValue) * 50
    return `hsl(${hue}, 100%, 50%)`
}

function random() {
    return Math.random().toString()
}
