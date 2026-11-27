/** Gap at noon on each side; ring runs clockwise from right gap to left gap. */
export const EXAM_RING_GAP_CLOCK_DEG = 20
export const EXAM_RING_START_CLOCK_DEG = EXAM_RING_GAP_CLOCK_DEG
export const EXAM_RING_END_CLOCK_DEG = 360 - EXAM_RING_GAP_CLOCK_DEG
export const EXAM_RING_SPAN_CLOCK_DEG = EXAM_RING_END_CLOCK_DEG - EXAM_RING_START_CLOCK_DEG

export function ringPointFromClockDeg(clockDeg: number, cx: number, cy: number, r: number) {
    const rad = (clockDeg * Math.PI) / 180
    return {
        x: cx + r * Math.sin(rad),
        y: cy - r * Math.cos(rad),
    }
}

/** Clockwise arc along the exam ring (clock degrees: 0 = noon, increases clockwise). */
export function ringArcPath(fromClockDeg: number, toClockDeg: number, cx: number, cy: number, r: number): string {
    if (toClockDeg <= fromClockDeg) return ''
    const start = ringPointFromClockDeg(fromClockDeg, cx, cy, r)
    const end = ringPointFromClockDeg(toClockDeg, cx, cy, r)
    const delta = toClockDeg - fromClockDeg
    const largeArc = delta > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export function fractionToRingClockDeg(fraction: number): number {
    const clamped = Math.max(0, Math.min(1, fraction))
    return EXAM_RING_START_CLOCK_DEG + clamped * EXAM_RING_SPAN_CLOCK_DEG
}

export type ExamRingLayout = {
    size: number
    stroke: number
    radius: number
    center: number
    trackPath: string
}

export function createExamRingLayout(size: number, stroke: number): ExamRingLayout {
    const radius = (size - stroke) / 2
    const center = size / 2
    const trackPath = ringArcPath(
        EXAM_RING_START_CLOCK_DEG,
        EXAM_RING_END_CLOCK_DEG,
        center,
        center,
        radius,
    )
    return { size, stroke, radius, center, trackPath }
}

export function ringTickSegment(
    clockDeg: number,
    cx: number,
    cy: number,
    radius: number,
    tickHalfLength: number,
): string {
    const inner = ringPointFromClockDeg(clockDeg, cx, cy, radius - tickHalfLength)
    const outer = ringPointFromClockDeg(clockDeg, cx, cy, radius + tickHalfLength)
    return `M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`
}