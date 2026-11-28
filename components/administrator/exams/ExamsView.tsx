'use client'

import { AgTableFull } from '@/components/administrator/AgTable'
import { fetchAdminDashboardUpcomingExams } from '@/lib/administrator/client'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ScrollIcon, TableIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { UpcomingExams } from '@/lib/jutge_api_client'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DualRangeSlider } from '@/components/administrator/DualRangeSlider'
import {
    Timeline,
    TimelineDescription,
    TimelineHeader,
    TimelineItem,
    TimelineTime,
    TimelineTitle,
} from '@/components/administrator/Timeline'

dayjs.extend(duration)
dayjs.extend(relativeTime)

export default function ExamsView() {
    const isMobile = useIsMobile()
    const [exams, setExams] = useState<UpcomingExams>([])
    const [view, setView] = useState<'table' | 'timeline'>(isMobile ? 'timeline' : 'table')
    const [range, setRange] = useState([-1, 14])

    useEffect(() => {
        async function fetchData() {
            const data = await fetchAdminDashboardUpcomingExams({
                daysBefore: -range[0],
                daysAfter: range[1],
            })
            setExams(data)
        }
        fetchData()
    }, [range])

    useEffect(() => {
        if (isMobile) {
            setView('timeline')
        } else {
            setView('table')
        }
    }, [isMobile])

    const colDefs = [
        {
            field: 'time',
            headerName: 'Scheduled time',
            width: 180,
            sort: 'asc',
            cellRenderer: (params: any) => dayjs(params.data.exp_time_start).format('YYYY-MM-DD HH:mm'),
            valueGetter: (params: any) => params.data.exp_time_start,
        },
        {
            field: 'when',
            width: 150,
            cellRenderer: (params: any) => {
                const d = dayjs(params.data.exp_time_start)
                const color = d.isBefore(dayjs()) ? 'text-gray-400' : ''
                return <div className={color}>{d.fromNow()}</div>
            },
            valueGetter: (params: any) => params.data.exp_time_start,
        },
        {
            field: 'title',
            flex: 3,
            filter: true,
        },
        {
            field: 'username',
            headerName: 'Organizer',
            flex: 2,
            filter: true,
        },
        {
            field: 'duration',
            width: 120,
            cellRenderer: (params: any) => dayjs.duration(params.data.running_time, 'minutes').humanize(),
            valueGetter: (params: any) => params.data.running_time,
        },
        {
            field: 'students',
            width: 100,
            type: 'rightAligned',
        },
    ]

    return (
        <>
            <div className="mb-4 flex flex-row items-center gap-2">
                <div className="flex-grow" />
                <div className="w-44 text-sm">
                    <DualRangeSlider
                        label={(value) => value}
                        labelPosition="bottom"
                        value={range}
                        onValueChange={setRange}
                        min={-14}
                        max={14}
                        step={1}
                    />
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SmoothButton
                                type="button"
                                color="blue"
                                variant="candy"
                                shape="pill"
                                size="icon"
                                className="ml-4 size-12"
                                aria-label="Change view"
                                onClick={() => setView(view === 'table' ? 'timeline' : 'table')}
                            >
                                {view === 'table' ? <ScrollIcon /> : <TableIcon />}
                            </SmoothButton>
                        </TooltipTrigger>
                        <TooltipContent>Change view</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {view === 'table' ? <AgTableFull rowData={exams} columnDefs={colDefs} /> : <ExamsTimeline exams={exams} />}
        </>
    )
}

function ExamsTimeline({ exams }: { exams: UpcomingExams }) {
    //

    const collapsedExams = []
    for (const exam of exams) {
        if (collapsedExams.length === 0) {
            collapsedExams.push([exam])
        } else {
            const last = collapsedExams[collapsedExams.length - 1]
            const lastExam = last[last.length - 1]
            if (lastExam.name === exam.name && lastExam.exp_time_start === exam.exp_time_start) {
                last.push(exam)
            } else {
                collapsedExams.push([exam])
            }
        }
    }

    const now = dayjs()

    return (
        <Timeline className="px-8">
            {collapsedExams.map((collapsedExam, i) => (
                <TimelineItem key={i}>
                    <TimelineHeader>
                        <TimelineTime
                            variant={dayjs(collapsedExam[0].exp_time_start).isBefore(now) ? 'secondary' : 'default'}
                        >
                            <div className="flex flex-col items-center font-normal">
                                <div className="text-sm">
                                    {dayjs(collapsedExam[0].exp_time_start).format('YYYY-MM-DD HH:mm')}
                                </div>
                                <div className="text-sm">{dayjs(collapsedExam[0].exp_time_start).fromNow()}</div>
                            </div>
                        </TimelineTime>
                        <TimelineTitle>{collapsedExam[0].name}</TimelineTitle>
                    </TimelineHeader>
                    {collapsedExam.map((exam, j) => (
                        <TimelineDescription key={`${i}-${j}`}>
                            {exam.title} ({exam.students})
                        </TimelineDescription>
                    ))}
                </TimelineItem>
            ))}
        </Timeline>
    )
}
