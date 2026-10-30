'use client'

import Link from 'next/link'
import { AgTableFull } from '@/components/administrator/AgTable'
import { DevIcon } from '@/components/administrator/DevIcon'
import { useProfileDialog } from '@/components/administrator/users/ProfileDialog'
import { useAuth } from '@/components/AuthProvider'
import { CompilerLink, VerdictLink, referenceLinkClassName } from '@/components/documentation/ReferenceLink'
import { ProblemIdLabel } from '@/components/problems/ProblemIdLabel'
import { ProblemTitleSummaryTooltip } from '@/components/problems/ProblemTitleSummaryTooltip'
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
    adminFatalizeIEs,
    adminFatalizePendings,
    adminResubmitIEs,
    adminResubmitPendings,
    fetchAdminQueue,
    fetchAdminUserProfiles,
    fetchTablesCompilers,
    fetchTablesVerdicts,
} from '@/lib/administrator/client'
import { parseProblemKey } from '@/lib/problems'
import { buildSubmissionHref } from '@/lib/submissions'
import { cn } from '@/lib/utils'
import { Compiler, SubmissionQueueItem, SubmissionQueueItems, Verdict } from '@/lib/jutge_api_client'
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
    const [compilers, setCompilers] = useState<Record<string, Compiler>>({})
    const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
    const [view, setView] = useState(defaultView)
    const [speed, setSpeed] = useState('5')
    const pollTickRef = useRef(0)
    const pausePollingUntilRef = useRef(0)

    const isMobile = useIsMobile()
    const { profile } = useAuth()
    const preferredLanguageId = profile?.language_id ?? null
    const [runProfileDialog, ProfileDialogComponent] = useProfileDialog()

    const pauseQueuePolling = useCallback(() => {
        pausePollingUntilRef.current = Date.now() + 60_000
    }, [])

    const openUserProfile = useCallback(
        async (userId: string) => {
            try {
                const profiles = await fetchAdminUserProfiles(userId)
                const match = profiles.find((p) => p.user_id === userId) ?? profiles[0]
                if (match) {
                    pauseQueuePolling()
                    await runProfileDialog(match)
                } else {
                    toast.error('Could not load user profile.')
                }
            } catch {
                toast.error('Could not load user profile.')
            }
        },
        [pauseQueuePolling, runProfileDialog],
    )

    useEffect(() => {
        let cancelled = false
        void Promise.all([fetchTablesCompilers(), fetchTablesVerdicts()]).then(([nextCompilers, nextVerdicts]) => {
            if (!cancelled) {
                setCompilers(nextCompilers)
                setVerdicts(nextVerdicts)
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    const fetchRows = useCallback(async () => {
        let verdictFilter: string[] = []
        const limit = 500

        if (view == 'queue') {
            verdictFilter = []
        } else if (view == 'zombies') {
            verdictFilter = ['IE', 'Pending']
        } else if (view == 'setter-errors') {
            verdictFilter = ['SE']
        } else if (view == 'fatal-errors') {
            verdictFilter = ['FE']
        } else if (view == 'pendings') {
            verdictFilter = ['Pending']
        } else if (view == 'internal-errors') {
            verdictFilter = ['IE']
        }
        return await fetchAdminQueue({ verdicts: verdictFilter, limit })
    }, [view])

    const colDefs = useMemo(
        () => [
            {
                field: 'time_in_desktop',
                hide: isMobile,
                headerName: 'Time',
                filter: true,
                width: 180,
                valueGetter: (p: { data?: SubmissionQueueItem }) => p.data?.time_in,
                cellRenderer: (p: { data: SubmissionQueueItem }) => {
                    return formatTime(p.data.time_in, isMobile)
                },
            },
            {
                field: 'time_in_mobile',
                hide: !isMobile,
                headerName: 'Time',
                filter: true,
                width: 90,
                valueGetter: (p: { data?: SubmissionQueueItem }) => p.data?.time_in,
                cellRenderer: (p: { data: SubmissionQueueItem }) => {
                    return formatTime(p.data.time_in, isMobile)
                },
            },
            {
                field: 'submission_uid',
                headerName: 'UID',
                filter: true,
                width: 115,
                cellRenderer: (p: { data: SubmissionQueueItem }) => (
                    <Link
                        href={buildSubmissionHref(p.data.problem_id, p.data.submission_id)}
                        className={referenceLinkClassName}
                    >
                        {p.data.submission_uid}
                    </Link>
                ),
            },
            {
                field: 'submission_id',
                hide: isMobile,
                headerName: 'ID',
                filter: true,
                width: 90,
                cellRenderer: (p: { data: SubmissionQueueItem }) => (
                    <Link
                        href={buildSubmissionHref(p.data.problem_id, p.data.submission_id)}
                        className={referenceLinkClassName}
                    >
                        {p.data.submission_id}
                    </Link>
                ),
            },
            {
                field: 'user_id',
                hide: isMobile,
                filter: true,
                headerName: 'User Id',
                width: 90,
                cellRenderer: (p: { data: SubmissionQueueItem }) => (
                    <button
                        type="button"
                        className={referenceLinkClassName}
                        onClick={() => void openUserProfile(p.data.user_id)}
                    >
                        {p.data.user_id}
                    </button>
                ),
            },
            {
                field: 'user',
                hide: isMobile,
                filter: true,
                headerName: 'User',
                flex: 1,
                valueGetter: (p: { data?: SubmissionQueueItem }) => p.data?.user__name ?? '',
                cellRenderer: (p: { data: SubmissionQueueItem }) => (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={referenceLinkClassName}
                                onClick={() => void openUserProfile(p.data.user_id)}
                            >
                                {p.data.user__name}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{p.data.user_id}</p>
                        </TooltipContent>
                    </Tooltip>
                ),
            },
            {
                field: 'problem_id',
                filter: true,
                headerName: 'Problem',
                width: 105,
                cellRenderer: (p: { data: SubmissionQueueItem }) => (
                    <ProblemTitleSummaryTooltip
                        problem_nm={queueProblemNm(p.data.problem_id)}
                        title={p.data.problem__title || p.data.problem_id}
                        preferredLanguageId={preferredLanguageId}
                    >
                        <Link href={queueProblemHref(p.data.problem_id)} className={referenceLinkClassName}>
                            <ProblemIdLabel problemId={p.data.problem_id} />
                        </Link>
                    </ProblemTitleSummaryTooltip>
                ),
            },
            {
                field: 'compiler_id',
                filter: true,
                width: 160,
                hide: isMobile,
                cellClass: '!overflow-visible',
                cellStyle: { display: 'flex', alignItems: 'center', overflow: 'visible' },
                cellRenderer: (p: { data: SubmissionQueueItem }) => (
                    <QueueCompilerCell
                        compilerId={p.data.compiler_id}
                        compilers={compilers}
                        onReferenceInteraction={pauseQueuePolling}
                    />
                ),
            },
            {
                field: 'veredict',
                headerName: 'Verdict',
                filter: true,
                width: 130,
                hide: isMobile,
                cellStyle: { display: 'flex', alignItems: 'center' },
                valueGetter: (p: { data?: SubmissionQueueItem }) => p.data?.veredict ?? 'Pending',
                cellRenderer: (p: { data: SubmissionQueueItem }) => (
                    <QueueVerdictCell
                        veredict={p.data.veredict ?? 'Pending'}
                        verdicts={verdicts}
                        onReferenceInteraction={pauseQueuePolling}
                    />
                ),
            },
            {
                field: 'info_mobile',
                headerName: 'Info',
                filter: true,
                width: 100,
                hide: !isMobile,
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (p: { data: SubmissionQueueItem }) => {
                    const veredict = p.data.veredict ?? 'Pending'
                    let emoji = '🔘'
                    let klass = 'animate-pulse'
                    const info = verdicts[veredict]
                    if (info && 'emoji' in info) {
                        emoji = info.emoji
                        klass = ''
                    }

                    return (
                        <Link
                            href={buildSubmissionHref(p.data.problem_id, p.data.submission_id)}
                            className={cn(referenceLinkClassName, 'flex flex-row items-center gap-2')}
                            aria-label={`Submission ${p.data.submission_id}`}
                        >
                            {devIcon(p.data.compiler_id, compilers)}
                            <span className={cn(klass)} aria-hidden>
                                {emoji}
                            </span>
                        </Link>
                    )
                },
            },
            {
                field: 'exam_id',
                hide: isMobile,
                headerName: 'Exam',
                filter: true,
                width: 110,
                cellRenderer: (p: { data: SubmissionQueueItem }) =>
                    p.data.exam_id ? (
                        <Link href={`/exams/${p.data.exam_id}`} className={referenceLinkClassName}>
                            {p.data.exam_id}
                        </Link>
                    ) : (
                        '—'
                    ),
            },
        ],
        [compilers, isMobile, openUserProfile, pauseQueuePolling, preferredLanguageId, verdicts],
    )

    useEffect(() => {
        let cancelled = false
        void fetchRows().then((nextRows) => {
            if (!cancelled) {
                setRows(nextRows)
            }
        })
        return () => {
            cancelled = true
        }
    }, [fetchRows])

    useEffect(() => {
        const interval = setInterval(() => {
            pollTickRef.current += 1
            const ispeed = parseInt(speed, 10)
            if (ispeed === 0) return
            if (Date.now() < pausePollingUntilRef.current) return
            if (pollTickRef.current % ispeed !== 0) return
            void fetchRows().then(setRows)
        }, 1000)

        return () => {
            clearInterval(interval)
        }
    }, [fetchRows, speed])

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
            <TooltipProvider>
                <AgTableFull
                    rowData={rows}
                    columnDefs={colDefs}
                    getRowId={(params: { data: SubmissionQueueItem }) => params.data.submission_uid}
                />
            </TooltipProvider>
            <ProfileDialogComponent />
        </>
    )
}

function queueProblemNm(problem_id: string): string {
    const parsed = parseProblemKey(problem_id)
    if (parsed.kind === 'problem_id' || parsed.kind === 'problem_nm') {
        return parsed.problem_nm
    }
    return problem_id
}

function queueProblemHref(problem_id: string): string {
    const parsed = parseProblemKey(problem_id)
    if (parsed.kind === 'problem_id' || parsed.kind === 'problem_nm') {
        return `/problems/${parsed.problem_nm}`
    }
    return `/problems/${problem_id}`
}

function QueueCompilerCell({
    compilerId,
    compilers,
    onReferenceInteraction,
}: {
    compilerId: string
    compilers: Record<string, Compiler>
    onReferenceInteraction: () => void
}) {
    const language = compilers[compilerId]?.language ?? 'Unknown'
    return (
        <div
            className="flex min-h-0 flex-row items-center gap-2 py-px"
            onMouseDownCapture={(event) => {
                event.stopPropagation()
                onReferenceInteraction()
            }}
        >
            <span className="inline-flex shrink-0 items-center">
                <DevIcon proglang={language} size={14} />
            </span>
            <CompilerLink compilerId={compilerId} />
        </div>
    )
}

function QueueVerdictCell({
    veredict,
    verdicts,
    onReferenceInteraction,
}: {
    veredict: string
    verdicts: Record<string, Verdict>
    onReferenceInteraction: () => void
}) {
    let emoji = '🔘'
    let klass = 'animate-pulse'
    const info = verdicts[veredict]
    if (info && 'emoji' in info) {
        emoji = info.emoji
        klass = ''
    }

    return (
        <div
            className="flex flex-row items-center gap-2"
            onMouseDownCapture={(event) => {
                event.stopPropagation()
                onReferenceInteraction()
            }}
        >
            <div className={cn(klass)} aria-hidden>
                {emoji}
            </div>
            <VerdictLink verdictId={veredict} />
        </div>
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
    const language = compiler_id in compilers ? compilers[compiler_id].language : 'Unknown'
    return (
        <span className="inline-flex shrink-0 items-center">
            <DevIcon proglang={language} size={14} />
        </span>
    )
}
