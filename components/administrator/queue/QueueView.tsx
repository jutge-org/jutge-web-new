'use client'

import { AgTableFull } from '@/components/administrator/AgTable'
import { DevIcon } from '@/components/administrator/DevIcon'
import dayjs from 'dayjs'
import {
    AudioLinesIcon,
    CatIcon,
    ChevronDownIcon,
    CircleDotDashedIcon,
    GhostIcon,
    PauseIcon,
    RabbitIcon,
    RotateCwIcon,
    SkullIcon,
    SnailIcon,
    TriangleAlertIcon,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
    adminFatalizeIEs,
    adminFatalizePendings,
    adminResubmitIEs,
    adminResubmitPendings,
    fetchAdminQueue,
    fetchTablesCompilers,
    fetchTablesVerdicts,
} from '@/lib/administrator/client'
import { Compiler, SubmissionQueueItem, SubmissionQueueItems } from '@/lib/jutge_api_client'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'

export default function QueueView() {
    //

    const searchParams = useSearchParams()
    const defaultView = searchParams.get('view') || 'queue'

    const [rows, setRows] = useState<SubmissionQueueItems>([])
    const [view, setView] = useState(defaultView)
    const [speed, setSpeed] = useState('5')
    const [counter, setCounter] = useState(0)
    const [colDefs, setColDefs] = useState<any[]>([])

    const isMobile = useIsMobile()

    const fetchData = useCallback(async () => {
        async function getRows() {
            let verdicts: string[] = []
            const limit = 500

            if (view == 'queue') {
                verdicts = []
            } else if (view == 'zombies') {
                verdicts = ['IE', 'Pending']
            } else if (view == 'setter-errors') {
                verdicts = ['SE']
            } else if (view == 'fatal-errors') {
                verdicts = ['FE']
            } else if (view == 'pendings') {
                verdicts = ['Pending']
            } else if (view == 'internal-errors') {
                verdicts = ['IE']
            }
            return await fetchAdminQueue({ verdicts, limit })
        }

        const rows = await getRows()
        const verdicts = await fetchTablesVerdicts()
        const compilers = await fetchTablesCompilers()

        const colDefs = [
            {
                field: 'time_in_desktop',
                hide: isMobile,
                headerName: 'Time',
                filter: true,
                width: 180,
                cellRenderer: (p: any) => {
                    return formatTime(p.data.time_in, isMobile)
                },
            },
            {
                field: 'time_in_mobile',
                hide: !isMobile,
                headerName: 'Time',
                filter: true,
                width: 90,
                cellRenderer: (p: any) => {
                    return formatTime(p.data.time_in, isMobile)
                },
            },
            {
                field: 'submission_uid',
                headerName: 'UID',
                filter: true,
                width: 115,
            },
            {
                field: 'submission_id',
                hide: isMobile,
                headerName: 'ID',
                filter: true,
                width: 90,
            },
            {
                field: 'user_id',
                hide: isMobile,
                filter: true,
                headerName: 'User Id',
                width: 90,
            },
            {
                field: 'user',
                hide: isMobile,
                filter: true,
                headerName: 'User',
                flex: 1,
                cellRenderer: (p: any) => {
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>{p.data.user__name}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{p.data.user_id}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                },
            },
            {
                field: 'problem_id',
                filter: true,
                headerName: 'Problem',
                width: 105,
            },
            {
                field: 'compiler',
                filter: true,
                width: 160,
                hide: isMobile,
                cellRenderer: (p: any) => {
                    return (
                        <div className="flex flex-row items-center gap-2">
                            {devIcon(p.data.compiler_id, compilers)}
                            {p.data.compiler_id}
                        </div>
                    )
                },
            },
            {
                field: 'veredict',
                headerName: 'Verdict',
                filter: true,
                width: 130,
                hide: isMobile,
                valueGetter: (p: { data?: SubmissionQueueItem }) => p.data?.veredict ?? 'Pending',
                cellRenderer: (p: any) => {
                    const item = p.data
                    let emoji = '🔘'
                    let klass = 'animate-pulse'
                    if (item.veredict && verdicts[item.veredict]) {
                        if ('emoji' in verdicts[item.veredict]) {
                            emoji = verdicts[item.veredict].emoji
                            if (item.veredict == 'AC') {
                                klass = '' // 'motion-safe:animate-spin'
                            } else {
                                klass = ''
                            }
                        }
                    }

                    return (
                        <div className="flex flex-row items-center gap-2">
                            <div className={klass}>{emoji}</div>
                            &nbsp;&nbsp;
                            {item.veredict}
                        </div>
                    )
                },
            },
            {
                field: 'info_mobile',
                headerName: 'Info',
                filter: true,
                width: 100,
                hide: !isMobile,
                cellRenderer: (p: any) => {
                    const item = p.data
                    let emoji = '🔘'
                    let klass = 'animate-pulse'
                    if (item.veredict && verdicts[item.veredict]) {
                        if ('emoji' in verdicts[item.veredict]) {
                            emoji = verdicts[item.veredict].emoji
                            if (item.veredict == 'AC') {
                                klass = '' // 'motion-safe:animate-spin'
                            } else {
                                klass = ''
                            }
                        }
                    }

                    return (
                        <div className="flex flex-row items-center gap-2">
                            {devIcon(p.data.compiler_id, compilers)}
                            <div className={klass}>{emoji}</div>
                        </div>
                    )
                },
            },
            {
                field: 'exam_id',
                hide: isMobile,
                headerName: 'Exam',
                filter: true,
                width: 110,
            },
        ]

        setRows(rows)
        setColDefs(colDefs)
    }, [view, isMobile])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        async function updateQueue() {
            const ispeed = parseInt(speed)
            setCounter(counter + 1)
            if ((rows !== null && ispeed == 0) || counter % ispeed != 0) return
            await fetchData()
        }

        const interval = setInterval(updateQueue, 1000)

        return () => {
            clearInterval(interval)
        }
    }, [counter, speed, rows, fetchData])

    function resubmitIEs() {
        void adminResubmitIEs()
        toast.success(`IEs resubmitted.`)
    }

    function resubmitPendings() {
        void adminResubmitPendings()
        toast.success(`Pendings resubmitted.`)
    }

    function fatalizeIEs() {
        void adminFatalizeIEs()
        toast.success(`IEs fatalized.`)
    }

    function fatalizePendings() {
        void adminFatalizePendings()
        toast.success(`Pendings fatalized.`)
    }

    return (
        <>
            <div className="mb-4 flex flex-row items-center gap-2">
                <Select onValueChange={setView} defaultValue={defaultView}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="queue">
                            <div className="flex flex-row gap-2 items-center">
                                <AudioLinesIcon className="h-4 w-4" /> Queue
                            </div>
                        </SelectItem>
                        <Separator className="my-2" />
                        <SelectItem value="pendings">
                            <div className="flex flex-row gap-2 items-center">
                                <CircleDotDashedIcon className="h-4 w-4" /> Pendings
                            </div>
                        </SelectItem>
                        <SelectItem value="internal-errors">
                            <div className="flex flex-row gap-2 items-center">
                                <TriangleAlertIcon className="h-4 w-4" /> Internal errors
                            </div>
                        </SelectItem>
                        <SelectItem value="zombies">
                            <div className="flex flex-row gap-2 items-center">
                                <GhostIcon className="h-4 w-4" /> Zombies
                            </div>
                        </SelectItem>
                        <SelectItem value="setter-errors">
                            <div className="flex flex-row gap-2 items-center">
                                <CatIcon className="h-4 w-4" /> Setter errors
                            </div>
                        </SelectItem>
                        <SelectItem value="fatal-errors">
                            <div className="flex flex-row gap-2 items-center">
                                <SkullIcon className="h-4 w-4" /> Fatal errors
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select onValueChange={setSpeed} defaultValue="5">
                    <SelectTrigger className="w-56" defaultValue="5">
                        <SelectValue placeholder="Speed" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">
                            <div className="flex flex-row gap-2 items-center">
                                <PauseIcon className="h-4 w-4" /> Pause
                            </div>
                        </SelectItem>
                        <SelectItem value="5">
                            <div className="flex flex-row gap-2 items-center">
                                <SnailIcon className="h-4 w-4" /> Slow (5s)
                            </div>
                        </SelectItem>
                        <SelectItem value="1">
                            <div className="flex flex-row gap-2 items-center">
                                <RabbitIcon className="h-4 w-4" /> Fast (1s)
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex-grow" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="w-32 justify-start flex flex-row">
                            Actions
                            <div className="flex-grow" />
                            <ChevronDownIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Internal errors</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={resubmitIEs}>
                            <RotateCwIcon />
                            Resubmit IEs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={fatalizeIEs}>
                            <SkullIcon />
                            Fatalize IEs
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Pending submissions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={resubmitPendings}>
                            <RotateCwIcon />
                            Resubmit Pendings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={fatalizePendings}>
                            <SkullIcon />
                            Fatalize Pendings
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <AgTableFull rowData={rows} columnDefs={colDefs} />
        </>
    )
}

function formatTime(datetime: string | number, isMobile: boolean) {
    if (isMobile) {
        return dayjs(datetime).format('HH:mm:ss')
    } else {
        const value = dayjs(datetime)
        const current_date = dayjs().format('YYYY-MM-DD')
        const date = value.format('YYYY-MM-DD')
        const time = value.format('HH:mm:ss')
        return current_date === date ? time : date + ' ' + time
    }
}

function devIcon(compiler_id: string, compilers: Record<string, Compiler>) {
    if (compiler_id in compilers) {
        return <DevIcon proglang={compilers[compiler_id].language} size={14} />
    }
    return <DevIcon proglang="Unknown" size={14} />
}
