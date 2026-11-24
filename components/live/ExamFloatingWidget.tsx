'use client'

import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

export const EXAM_FLOATING_WIDGET_SIZE_PX = 300

export function ExamFloatingWidget() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(id)
    }, [])

    const label = dayjs(now).format('HH:mm:ss')

    return (
        <div className="flex size-[300px] items-center justify-center bg-background text-foreground">
            <time className="text-4xl font-semibold tabular-nums tracking-tight" dateTime={now.toISOString()}>
                {label}
            </time>
        </div>
    )
}