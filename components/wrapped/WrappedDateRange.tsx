'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { ArrowRightIcon } from 'lucide-react'

import { Radio, RadioGroup } from '@/components/smoothui/radio-group'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    formatIsoDateRangeForDisplay,
    getCurrentAcademicYearRange,
    type WrappedPeriod,
} from '@/lib/wrapped/period'
import { t } from '@/lib/wrapped/strings'

const CUSTOM_OPTION = 'custom'
const ALL_TIME_OPTION = 'all-time'
const ACADEMIC_OPTION = 'academic'
const CALENDAR_YEAR_OPTION = 'calendar-year'
const LAST_12_OPTION = 'last-12'

type WrappedDateRangeProps = {
    onSelect: (period: WrappedPeriod) => void
}

type PresetOption = {
    id: string
    label: string
    period: WrappedPeriod
}

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10)
}

function todayIso(now = new Date()): string {
    return toIsoDate(now)
}

function yearsAgoIso(years: number, now = new Date()): string {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() - years)
    return toIsoDate(d)
}

function clipEndToToday(end: string, today: string): string {
    return end > today ? today : end
}

export function WrappedDateRange({ onSelect }: WrappedDateRangeProps) {
    const academic = getCurrentAcademicYearRange()
    const today = todayIso()
    const year = new Date().getFullYear()
    const allTimeLabel = t('period.allTime')
    const last12Label = t('period.last12Months')
    const academicEnd = clipEndToToday(academic.end, today)

    const [start, setStart] = useState(academic.start)
    const [end, setEnd] = useState(academicEnd)
    const [selected, setSelected] = useState(ACADEMIC_OPTION)

    const presetOptions: PresetOption[] = [
        {
            id: ACADEMIC_OPTION,
            label: academic.label,
            period: {
                start: academic.start,
                end: academicEnd,
                label: academic.label,
            },
        },
        {
            id: CALENDAR_YEAR_OPTION,
            label: String(year),
            period: {
                start: `${year}-01-01`,
                end: today,
                label: String(year),
            },
        },
        {
            id: LAST_12_OPTION,
            label: last12Label,
            period: {
                start: yearsAgoIso(1),
                end: today,
                label: last12Label,
            },
        },
    ]

    const isCustom = selected === CUSTOM_OPTION
    const selectedPreset = presetOptions.find((preset) => preset.id === selected)
    const canSubmit = isCustom
        ? Boolean(start && end && start <= end)
        : selected === ALL_TIME_OPTION || Boolean(selectedPreset)

    function applyPeriod(period: WrappedPeriod) {
        if (period.start && period.end && period.start > period.end) return
        onSelect(period)
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!canSubmit) return

        if (selected === ALL_TIME_OPTION) {
            applyPeriod({
                start: null,
                end: null,
                label: allTimeLabel,
            })
            return
        }

        if (isCustom) {
            if (!start || !end || start > end) return
            applyPeriod({
                start,
                end,
                label: formatIsoDateRangeForDisplay(start, end),
            })
            return
        }

        if (selectedPreset) {
            applyPeriod(selectedPreset.period)
        }
    }

    return (
        <Card className="w-full gap-0 overflow-hidden rounded-2xl border border-border flex flex-col items-center">
            <div className="flex justify-center p-8">
                <div className="grid w-full md:w-auto md:grid-cols-[auto_minmax(0,42rem)]">
                    <div className="flex justify-center md:h-0 md:min-h-full">
                        <Image
                            src="/wrapped/jutge-wrapped.webp"
                            alt={`${t('common.brand')} ${t('common.wrapped')}`}
                            width={506}
                            height={1024}
                            priority
                            sizes="(max-width: 768px) 100vw, 40vw"
                            className="h-auto w-full object-contain md:h-full md:w-auto rounded-2xl"
                        />
                    </div>
                    <div className="mx-auto flex w-full max-w-2xl flex-col py-4 pl-8">
                        <h1
                            className={
                                '[--color-brand-title:oklch(0.40_0.15_232)] dark:[--color-brand-title:inherit] ' +
                                'pb-1 text-center font-thin leading-[1.2] tracking-wide text-balance text-7xl sm:text-6xl ' +
                                'text-[var(--color-brand-title)] dark:bg-linear-to-r dark:from-cyan-300 dark:via-sky-400 dark:to-blue-500 dark:bg-clip-text dark:text-transparent'
                            }
                        >
                            {t('common.brand')} {t('common.wrapped')}
                        </h1>
                        <CardContent className="flex flex-col gap-6">
                            <p className="text-sm text-muted-foreground">{t('dateRange.intro')}</p>

                            <form onSubmit={handleSubmit}>
                                <RadioGroup
                                    value={selected}
                                    onValueChange={setSelected}
                                    className="gap-4 pl-4"
                                    aria-label={t('dateRange.intro')}
                                >
                                    {presetOptions.map((preset) => (
                                        <Radio
                                            key={preset.id}
                                            value={preset.id}
                                            id={`wrapped-period-${preset.id}`}
                                        >
                                            {preset.label}
                                        </Radio>
                                    ))}

                                    <Radio value={ALL_TIME_OPTION} id="wrapped-period-all-time">
                                        {allTimeLabel}
                                    </Radio>

                                    <div className="-mt-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Radio
                                                value={CUSTOM_OPTION}
                                                id="wrapped-period-custom"
                                            >
                                                {t('dateRange.customRange')}
                                            </Radio>
                                            <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5">
                                                <Input
                                                    id="wrapped-from"
                                                    type="date"
                                                    aria-label={t('dateRange.from')}
                                                    required={isCustom}
                                                    disabled={!isCustom}
                                                    max={today}
                                                    value={start}
                                                    onChange={(e) => setStart(e.target.value)}
                                                    className="h-7 min-w-0 flex-1 px-1.5 text-xs md:text-xs"
                                                />
                                                <ArrowRightIcon
                                                    className="size-3.5 shrink-0 text-muted-foreground"
                                                    aria-hidden
                                                />
                                                <Input
                                                    id="wrapped-to"
                                                    type="date"
                                                    aria-label={t('dateRange.to')}
                                                    required={isCustom}
                                                    disabled={!isCustom}
                                                    max={today}
                                                    value={end}
                                                    onChange={(e) => setEnd(e.target.value)}
                                                    className="h-7 min-w-0 flex-1 px-1.5 text-xs md:text-xs"
                                                />
                                            </div>
                                        </div>
                                        {isCustom && start && end && start > end ? (
                                            <p className="pl-6 text-sm text-destructive">
                                                {t('dateRange.invalidRange')}
                                            </p>
                                        ) : null}
                                    </div>
                                </RadioGroup>

                                <SmoothButton
                                    type="submit"
                                    variant="candy"
                                    color="accent"
                                    className="mt-8 w-full"
                                    disabled={!canSubmit}
                                >
                                    {t('dateRange.buildWrapped')}
                                </SmoothButton>
                            </form>
                        </CardContent>
                    </div>
                </div>
            </div>
        </Card>
    )
}
