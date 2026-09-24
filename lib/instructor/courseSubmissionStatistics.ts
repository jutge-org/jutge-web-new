import type { ColorMapping, CourseSubmission, HeatmapCalendar } from '@/lib/jutge_api_client'
import dayjs, { type Dayjs } from 'dayjs'

export type OkKoPoint = { label: string; ok: number; ko: number }

export type VolumeOverTimePoint = { key: number; label: string; ok: number; ko: number }

export const SUBMISSION_VOLUME_BUCKET_SIZE_MIN = 1
export const SUBMISSION_VOLUME_BUCKET_SIZE_MAX = 25
export const SUBMISSION_VOLUME_BUCKET_SIZE_DEFAULT = 10

function nDayBucketStart(t: Dayjs, periodStart: Dayjs, bucketSizeDays: number): Dayjs {
    const start = periodStart.startOf('day')
    const daysSinceStart = Math.max(0, t.startOf('day').diff(start, 'day'))
    const bucketIndex = Math.floor(daysSinceStart / bucketSizeDays)
    return start.add(bucketIndex * bucketSizeDays, 'day')
}

function earliestSubmissionDay(submissions: CourseSubmission[]): Dayjs {
    let earliest = dayjs(submissions[0].time)
    for (const submission of submissions) {
        const time = dayjs(submission.time)
        if (time.isBefore(earliest)) earliest = time
    }
    return earliest.startOf('day')
}

function formatNDayBucketLabel(bucket: Dayjs, bucketSizeDays: number): string {
    if (bucketSizeDays >= 365) return bucket.format('YYYY')
    if (bucketSizeDays >= 28) return bucket.format('MMM YYYY')
    return bucket.format('MMM D')
}

export function deriveSubmissionVolumeOverTime(
    submissions: CourseSubmission[],
    periodStart: Dayjs | Date,
    periodEnd: Dayjs | Date,
    bucketSizeDays: number,
): VolumeOverTimePoint[] {
    const start = dayjs(periodStart).startOf('day')
    const end = dayjs(periodEnd).endOf('day')
    const bucketSize = Math.max(SUBMISSION_VOLUME_BUCKET_SIZE_MIN, Math.floor(bucketSizeDays))

    const counts = new Map<number, { ok: number; ko: number }>()
    for (const s of submissions) {
        const time = dayjs(s.time)
        if (time.isBefore(start) || time.isAfter(end)) continue
        const bucket = nDayBucketStart(time, start, bucketSize)
        if (bucket.isBefore(start) || bucket.isAfter(end)) continue
        const key = bucket.valueOf()
        const existing = counts.get(key) ?? { ok: 0, ko: 0 }
        if (s.verdict === 'AC') existing.ok += 1
        else existing.ko += 1
        counts.set(key, existing)
    }

    const points: VolumeOverTimePoint[] = []
    let cursor = nDayBucketStart(start, start, bucketSize)
    while (!cursor.isAfter(end)) {
        const key = cursor.valueOf()
        const { ok = 0, ko = 0 } = counts.get(key) ?? {}
        points.push({ key, label: formatNDayBucketLabel(cursor, bucketSize), ok, ko })
        cursor = cursor.add(bucketSize, 'day')
    }
    return points
}

export type CourseSubmissionChartData = {
    heatmapData: HeatmapCalendar
    heatmapStart: Dayjs
    heatmapEnd: Dayjs
    maxValue: number
    submissionVolumeOverTime: VolumeOverTimePoint[]
    submissionsByMonth: OkKoPoint[]
    submissionsByWeekday: OkKoPoint[]
    submissionsByHour: OkKoPoint[]
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export function getCategoryColor(key: string, category: string, colors: ColorMapping): string {
    if (!(category in colors) || !(key in colors[category as keyof ColorMapping])) {
        return 'hsl(var(--chart-1))'
    }
    return colors[category as keyof ColorMapping][key as keyof ColorMapping[keyof ColorMapping]]
}

export function deriveCourseSubmissionChartData(
    submissions: CourseSubmission[],
    period?: { start: Date | Dayjs; end: Date | Dayjs },
): CourseSubmissionChartData {
    const isOk = (verdict: string) => verdict === 'AC'

    const periodStart = period ? dayjs(period.start).startOf('day') : null
    const periodEnd = period ? dayjs(period.end).endOf('day') : null
    const inPeriod =
        periodStart && periodEnd
            ? submissions.filter((s) => {
                  const t = dayjs(s.time)
                  return !t.isBefore(periodStart) && !t.isAfter(periodEnd)
              })
            : submissions

    const byDay: Record<string, number> = {}
    for (const s of inPeriod) {
        const key = dayjs(s.time).format('YYYY-MM-DD')
        byDay[key] = (byDay[key] ?? 0) + 1
    }
    const heatmapData: HeatmapCalendar = Object.entries(byDay).map(([key, value]) => ({
        date: dayjs(key).startOf('day').unix(),
        value,
    }))
    const maxValue = heatmapData.length ? Math.max(...heatmapData.map((d) => d.value)) : 0
    const heatmapStart = periodStart ?? (inPeriod.length > 0 ? earliestSubmissionDay(inPeriod) : dayjs().startOf('day'))
    // Exclusive end: the calendar draws each day while `day` is before `heatmapEnd`.
    const heatmapEnd = periodEnd ? periodEnd.startOf('day').add(1, 'day') : dayjs().add(1, 'day').startOf('day')

    const byMonth: Record<number, { ok: number; ko: number }> = {}
    for (let m = 0; m < 12; m++) byMonth[m] = { ok: 0, ko: 0 }
    const byDow: Record<number, { ok: number; ko: number }> = {}
    for (let i = 0; i < 7; i++) byDow[i] = { ok: 0, ko: 0 }
    const byHour: Record<number, { ok: number; ko: number }> = {}
    for (let h = 0; h < 24; h++) byHour[h] = { ok: 0, ko: 0 }
    for (const s of inPeriod) {
        const t = dayjs(s.time)
        const ok = isOk(s.verdict)

        const m = t.month()
        if (ok) byMonth[m].ok += 1
        else byMonth[m].ko += 1

        const d = t.day()
        const idx = (d + 6) % 7
        if (ok) byDow[idx].ok += 1
        else byDow[idx].ko += 1

        const h = t.hour()
        if (ok) byHour[h].ok += 1
        else byHour[h].ko += 1
    }

    const submissionsByMonth: OkKoPoint[] = MONTHS.map((label, i) => ({
        label,
        ok: byMonth[i].ok,
        ko: byMonth[i].ko,
    }))

    const submissionsByWeekday: OkKoPoint[] = WEEKDAYS.map((label, i) => ({
        label,
        ok: byDow[i].ok,
        ko: byDow[i].ko,
    }))

    const submissionsByHour: OkKoPoint[] = Array.from({ length: 24 }, (_, h) => ({
        label: h.toString(),
        ok: byHour[h].ok,
        ko: byHour[h].ko,
    }))

    const volumeStart = periodStart ?? heatmapStart
    const volumeEnd = periodEnd ?? heatmapEnd.subtract(1, 'day').endOf('day')
    const submissionVolumeOverTime = deriveSubmissionVolumeOverTime(
        inPeriod,
        volumeStart,
        volumeEnd,
        SUBMISSION_VOLUME_BUCKET_SIZE_DEFAULT,
    )

    return {
        heatmapData,
        heatmapStart,
        heatmapEnd,
        maxValue,
        submissionVolumeOverTime,
        submissionsByMonth,
        submissionsByWeekday,
        submissionsByHour,
    }
}
