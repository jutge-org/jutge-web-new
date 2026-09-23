'use client'

import FloatingToolbar from '@/components/instructor/FloatingToolbar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { CalendarIcon, CheckIcon, FunnelIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

dayjs.extend(customParseFormat)

const DATE_FORMAT = 'YYYY-MM-DD'
const CALENDAR_START_MONTH = new Date(2000, 0)
const CALENDAR_END_MONTH = new Date(new Date().getFullYear() + 1, 11)

function formatDateValue(date: Date | undefined): string {
    return date && dayjs(date).isValid() ? dayjs(date).format(DATE_FORMAT) : ''
}

type DatePickerFieldProps = {
    label: string
    value: Date
    onChange: (d: Date | undefined) => void
}

function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
    const inputId = useId()
    const [open, setOpen] = useState(false)
    const [month, setMonth] = useState<Date | undefined>(value)
    const [inputValue, setInputValue] = useState(() => formatDateValue(value))

    useEffect(() => {
        setInputValue(formatDateValue(value))
        if (value && dayjs(value).isValid()) setMonth(value)
    }, [value])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value
        setInputValue(text)
        const parsed = dayjs(text, DATE_FORMAT, true)
        if (parsed.isValid()) {
            const date = parsed.toDate()
            onChange(date)
            setMonth(date)
        }
    }

    const handleCalendarSelect = (date: Date | undefined) => {
        onChange(date)
        if (date) {
            setInputValue(formatDateValue(date))
            setMonth(date)
        }
        setOpen(false)
    }

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-sm font-medium text-muted-foreground">
                {label}
            </label>
            <div className="relative">
                <Input
                    id={inputId}
                    value={inputValue}
                    placeholder={DATE_FORMAT}
                    className="w-[160px] pr-9"
                    onChange={handleInputChange}
                    onBlur={() => setInputValue(formatDateValue(value))}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                            event.preventDefault()
                            setOpen(true)
                        }
                    }}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Open ${label.toLowerCase()} calendar`}
                                        className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Open calendar</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={value}
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={handleCalendarSelect}
                            captionLayout="dropdown"
                            startMonth={CALENDAR_START_MONTH}
                            endMonth={CALENDAR_END_MONTH}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

type CourseStatisticsPeriodDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    startDate: Date
    endDate: Date
    defaultStartDate: Date
    defaultEndDate: Date
    onAccept: (startDate: Date, endDate: Date) => void
}

export function CourseStatisticsPeriodDialog({
    open,
    onOpenChange,
    startDate,
    endDate,
    defaultStartDate,
    defaultEndDate,
    onAccept,
}: CourseStatisticsPeriodDialogProps) {
    const [draftStartDate, setDraftStartDate] = useState<Date>(() => startDate)
    const [draftEndDate, setDraftEndDate] = useState<Date>(() => endDate)

    useEffect(() => {
        if (open) {
            setDraftStartDate(startDate)
            setDraftEndDate(endDate)
        }
    }, [open, startDate, endDate])

    const handleResetDraft = () => {
        setDraftStartDate(defaultStartDate)
        setDraftEndDate(defaultEndDate)
    }

    const handleAccept = () => {
        onAccept(draftStartDate, draftEndDate)
        onOpenChange(false)
    }

    return (
        <FloatingToolbar>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                    <Button
                        size="icon"
                        variant="default"
                        className="h-14 w-14 rounded-full"
                        aria-label="Open statistics period settings"
                    >
                        <FunnelIcon className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Statistics period</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-wrap items-end gap-2 py-2">
                        <DatePickerField
                            label="Start date"
                            value={draftStartDate}
                            onChange={(d) => d != null && setDraftStartDate(d)}
                        />
                        <DatePickerField
                            label="End date"
                            value={draftEndDate}
                            onChange={(d) => d != null && setDraftEndDate(d)}
                        />
                    </div>
                    <DialogFooter className="flex flex-col gap-0">
                        <Button variant="outline" onClick={handleResetDraft} className="w-full">
                            <RotateCcwIcon className="h-4 w-4" />
                            Reset
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full">
                                <XIcon className="h-4 w-4" />
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button onClick={handleAccept} className="w-full">
                            <CheckIcon className="h-4 w-4" />
                            Accept
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FloatingToolbar>
    )
}
