import { cn } from '@/lib/utils'

const GAUGE_COLORS = {
    track: '#EFEBE0',
    tick: '#D1D1D1',
    labelMuted: '#8A8A82',
} as const

export interface GaugeInterval {
    minimum: number
    maximum: number
    color: string
}

export interface GaugeProps {
    value: number
    minimum?: number
    maximum?: number
    tickInterval?: number
    intervals?: GaugeInterval[]
    className?: string
    size?: number
    showValue?: boolean
    title?: string
    textScale?: number
    handleWidth?: number
    strokeWidth?: number
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function valueToFraction(value: number, minimum: number, maximum: number) {
    if (maximum === minimum) {
        return 0
    }

    return clamp((value - minimum) / (maximum - minimum), 0, 1)
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
    return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
    }
}

function describeBottomArcSegment(cx: number, cy: number, radius: number, tStart: number, tEnd: number) {
    if (tEnd <= tStart) {
        return null
    }

    const start = polarToCartesian(cx, cy, radius, Math.PI + tStart * Math.PI)
    const end = polarToCartesian(cx, cy, radius, Math.PI + tEnd * Math.PI)

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`
}

function describeBottomArc(cx: number, cy: number, radius: number) {
    return describeBottomArcSegment(cx, cy, radius, 0, 1)
}

function topSemicirclePoint(cx: number, cy: number, radius: number, fraction: number) {
    const angle = Math.PI - fraction * Math.PI

    return {
        x: cx + radius * Math.cos(angle),
        y: cy - radius * Math.sin(angle),
    }
}

function generateTickValues(minimum: number, maximum: number, tickInterval: number) {
    const ticks: number[] = []

    for (let tick = minimum; tick <= maximum; tick += tickInterval) {
        ticks.push(Number(tick.toFixed(10)))
    }

    const lastTick = ticks[ticks.length - 1]
    if (lastTick === undefined || lastTick !== maximum) {
        ticks.push(maximum)
    }

    return ticks
}

function formatGaugeValue(value: number, tickInterval?: number) {
    if (tickInterval !== undefined && tickInterval > 0 && tickInterval < 1) {
        const decimals = String(tickInterval).split('.')[1]?.length ?? 1
        return value.toFixed(decimals)
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function Gauge({
    value,
    minimum = 0,
    maximum = 100,
    tickInterval = 10,
    intervals,
    className,
    size = 240,
    showValue = true,
    title,
    textScale = 1,
    handleWidth = 6,
    strokeWidth = 12,
}: GaugeProps) {
    const valueFraction = valueToFraction(value, minimum, maximum)

    const cx = 100
    const cy = 100
    const radius = 70
    const handleHubRadius = handleWidth * 1.25
    const needleLength = radius + strokeWidth / 2
    const tickLabelSize = 9 * textScale
    const valueSize = 18 * textScale
    const titleSize = 11 * textScale
    const tickValues = generateTickValues(minimum, maximum, tickInterval)

    const ticks = tickValues.map((tickValue) => {
        const fraction = valueToFraction(tickValue, minimum, maximum)
        const point = topSemicirclePoint(cx, cy, radius - strokeWidth / 2, fraction)
        const outer = topSemicirclePoint(cx, cy, radius + 14, fraction)
        const labelPoint = topSemicirclePoint(cx, cy, radius + 24, fraction)

        return {
            value: tickValue,
            x1: point.x,
            y1: point.y,
            x2: outer.x,
            y2: outer.y,
            labelX: labelPoint.x,
            labelY: labelPoint.y,
        }
    })

    const intervalSegments =
        intervals
            ?.map((interval) => {
                const tStart = valueToFraction(interval.minimum, minimum, maximum)
                const tEnd = valueToFraction(interval.maximum, minimum, maximum)

                return {
                    color: interval.color,
                    path: describeBottomArcSegment(cx, cy, radius, tStart, tEnd),
                }
            })
            .filter((segment) => segment.path !== null) ?? []

    const needlePoint = topSemicirclePoint(cx, cy, needleLength, valueFraction)
    const bottomArcPath = describeBottomArc(cx, cy, radius)
    const arcBottom = cy + radius + strokeWidth / 2
    const valueY = cy + 50
    const titleY = showValue ? valueY + valueSize / 2 + titleSize / 2 + 4 : cy + 46
    const viewBoxHeight = title ? Math.max(arcBottom + 6, titleY + titleSize / 2 + 6) : arcBottom + 4

    return (
        <div className={cn('inline-flex flex-col items-center', className)}>
            <svg
                viewBox={`0 0 200 ${viewBoxHeight}`}
                width={size}
                height={(size * viewBoxHeight) / 200}
                className="overflow-visible text-foreground"
                role="img"
                aria-label={`${title ? `${title}: ` : ''}Gauge value ${formatGaugeValue(value, tickInterval)} from ${minimum} to ${maximum}`}
            >
                {ticks.map((tick) => (
                    <line
                        key={tick.value}
                        x1={tick.x1}
                        y1={tick.y1}
                        x2={tick.x2}
                        y2={tick.y2}
                        stroke={GAUGE_COLORS.tick}
                        strokeWidth={1}
                    />
                ))}
                {bottomArcPath ? (
                    <path
                        d={bottomArcPath}
                        fill="none"
                        stroke={GAUGE_COLORS.track}
                        strokeWidth={strokeWidth}
                        strokeLinecap="butt"
                    />
                ) : null}
                {intervalSegments.map((segment, index) => (
                    <path
                        key={`${segment.color}-${index}`}
                        d={segment.path!}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="butt"
                    />
                ))}
                {ticks.map((tick) => (
                    <text
                        key={tick.value}
                        x={tick.labelX}
                        y={tick.labelY}
                        fill={GAUGE_COLORS.labelMuted}
                        fontSize={tickLabelSize}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {formatGaugeValue(tick.value, tickInterval)}
                    </text>
                ))}
                <circle cx={cx} cy={cy} r={handleHubRadius} fill="currentColor" />
                <line
                    x1={cx}
                    y1={cy}
                    x2={needlePoint.x}
                    y2={needlePoint.y}
                    stroke="currentColor"
                    strokeWidth={handleWidth}
                    strokeLinecap="round"
                />
                {showValue ? (
                    <text
                        x={cx}
                        y={valueY}
                        fill="currentColor"
                        fontSize={valueSize*0.8}
                        fontWeight={500}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {formatGaugeValue(value, tickInterval)}
                    </text>
                ) : null}
                {title ? (
                    <text
                        x={cx}
                        y={titleY}
                        fill="currentColor"
                        fontSize={titleSize}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {title}
                    </text>
                ) : null}
            </svg>
        </div>
    )
}

/*

export function TestGauge() {
    const INTERVALS = [
        { minimum: 0, maximum: 20, color: '#22c55e' },
        { minimum: 20, maximum: 70, color: '#f59e0b' },
        { minimum: 70, maximum: 100, color: '#ef4444' },
    ]

    const [value, setValue] = useState(75)

    return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-8">
            <Gauge
                value={value}
                minimum={0}
                maximum={100}
                tickInterval={10}
                intervals={INTERVALS}
                size={280}
                title="CPU usage"
                handleWidth={8}
                strokeWidth={20}
            />
            <Gauge
                value={value}
                minimum={0}
                maximum={100}
                tickInterval={20}
                intervals={INTERVALS}
                size={120}
                showValue={false}
                title="CPU usage"
                textScale={2}
            />
            <label className="flex w-full flex-col gap-2 text-sm">
                <span className="text-muted-foreground">Value: {value}</span>
                <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={value}
                    onChange={(event) => setValue(Number(event.target.value))}
                    className="w-full"
                />
            </label>
        </div>
    )
}
*/
