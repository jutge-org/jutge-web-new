'use client'

import type { ColDef, RowClickedEvent } from 'ag-grid-community'
import { CheckIcon, ClockPlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'

import { AgTableFull } from '@/components/administrator/AgTable'
import { EmailAddressText } from '@/components/general/EmailAddressText'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import AnimatedToggle, { XS_BLUE_CANDY_MORPH_TOGGLE } from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    fetchLiveRoster,
    formatLiveDateTime,
    liveErrorMessage,
    type LiveRosterEntry,
} from '@/lib/data/liveExam'
import jutge from '@/lib/jutge'
import { cn } from '@/lib/utils'

const defaultColDef: ColDef<LiveRosterEntry> = {
    sortable: true,
    filter: true,
    resizable: false,
}

const yesNoFilterParams = {
    filterOptions: ['equals', 'notEqual'] as const,
    defaultOption: 'equals',
    maxNumConditions: 1,
}

function flagCell(value: number | null | undefined): string {
    return value ? 'Yes' : 'No'
}

function LiveParticipantIpList({ ips }: { ips: string[] }) {
    if (ips.length === 0) {
        return <p className="text-sm text-muted-foreground">—</p>
    }
    return (
        <ul className="flex list-none flex-col gap-1 p-0 text-sm">
            {ips.map((ip) => (
                <li key={ip}>{ip}</li>
            ))}
        </ul>
    )
}

type LiveStudentsToolbarProps = {
    pending: boolean
    onApplyAll: (minutes: number, reason: string) => Promise<boolean>
}

const ALL_MINUTES_SLIDER_MIN = -60
const ALL_MINUTES_SLIDER_MAX = 60

function clampLiveMinutes(value: number): number {
    return Math.min(ALL_MINUTES_SLIDER_MAX, Math.max(ALL_MINUTES_SLIDER_MIN, value))
}

function liveMinutesInputChange(
    event: ChangeEvent<HTMLInputElement>,
    setMinutes: (minutes: number) => void,
) {
    const next = Number(event.target.value)
    if (Number.isNaN(next)) {
        setMinutes(0)
        return
    }
    setMinutes(clampLiveMinutes(next))
}

function LiveStudentsToolbar({ pending, onApplyAll }: LiveStudentsToolbarProps) {
    const [open, setOpen] = useState(false)
    const [minutes, setMinutes] = useState(5)
    const [reason, setReason] = useState('')

    async function submit(event: FormEvent) {
        event.preventDefault()
        const ok = await onApplyAll(minutes, reason.trim())
        if (!ok) return
        toast.success('Exam time updated for all participants.')
        setOpen(false)
        setReason('')
        setMinutes(5)
    }

    return (
        <div className="flex flex-row items-center gap-2">
            <div className="flex-grow" />
            <SmoothButton
                color="blue"
                size="xs"
                type="button"
                variant="candy"
                disabled={pending}
                onClick={() => setOpen(true)}
                className="w-36"
            >
                <ClockPlusIcon className="size-4" aria-hidden />
                Change time to all
            </SmoothButton>
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next)
                    if (!next) {
                        setReason('')
                        setMinutes(5)
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
                        <DialogHeader>
                            <DialogTitle>Change time to all participants</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-2 mt-4">
                            <Label htmlFor="all-minutes">Minutes to add (negative to remove)</Label>
                            <Input
                                id="all-minutes"
                                type="number"
                                className="w-24 tabular-nums"
                                min={ALL_MINUTES_SLIDER_MIN}
                                max={ALL_MINUTES_SLIDER_MAX}
                                step={1}
                                value={minutes}
                                disabled={pending}
                                onChange={(event) => liveMinutesInputChange(event, setMinutes)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="all-reason">Reason</Label>
                            <Input
                                id="all-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                required
                            />
                        </div>
                        <SmoothButton
                            className="w-full mt-4"
                            color="blue"
                            disabled={pending}
                            loading={pending}
                            type="submit"
                            variant="candy"
                        >
                            <ClockPlusIcon className="size-4" aria-hidden />
                            Change time to all participants
                        </SmoothButton>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

type LiveStudentManageDialogProps = {
    student: LiveRosterEntry | null
    open: boolean
    onOpenChange: (open: boolean) => void
    contest: boolean
    pending: boolean
    onRun: (action: () => Promise<void>) => Promise<boolean>
}

function LiveStudentManageDialog({
    student,
    open,
    onOpenChange,
    contest,
    pending,
    onRun,
}: LiveStudentManageDialogProps) {
    const [finished, setFinished] = useState(false)
    const [banned, setBanned] = useState(false)
    const [invited, setInvited] = useState(false)
    const [minutes, setMinutes] = useState(0)

    useEffect(() => {
        if (!open || !student) return
        setFinished(!!student.finished)
        setBanned(!!student.banned)
        setInvited(!!student.invited)
        setMinutes(0)
    }, [open, student])

    if (!student) return null

    const rosterEntry = student

    const dirty =
        finished !== !!student.finished ||
        banned !== !!student.banned ||
        (contest && invited !== !!student.invited) ||
        minutes !== 0

    async function applyChanges(event: FormEvent) {
        event.preventDefault()
        const email = rosterEntry.email
        const wasFinished = !!rosterEntry.finished
        const wasBanned = !!rosterEntry.banned
        const wasInvited = !!rosterEntry.invited
        const ok = await onRun(async () => {
            if (finished !== wasFinished) {
                if (finished) await jutge.tutor.examctl.finish({ email })
                else await jutge.tutor.examctl.unfinish({ email })
            }
            if (banned !== wasBanned) {
                if (banned) await jutge.tutor.examctl.ban({ email, reason_ban: '' })
                else await jutge.tutor.examctl.unban({ email })
            }
            if (contest && invited !== wasInvited) {
                if (invited) await jutge.tutor.examctl.invite({ email })
                else await jutge.tutor.examctl.uninvite({ email })
            }
            if (minutes !== 0) {
                await jutge.tutor.examctl.addStudentMinutes({
                    email,
                    minutes,
                    reason_inc: '',
                })
            }
        })
        if (!ok) return
        toast.success('Participant properties updated.')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <form className="flex flex-col gap-4" onSubmit={(event) => void applyChanges(event)}>
                    <DialogHeader>
                        <DialogTitle>Participant properties</DialogTitle>
                    </DialogHeader>
                    <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border [&>*]:px-3">
                        <ProfileFormRow label="Name">
                            <p className="text-sm">{student.name || '—'}</p>
                        </ProfileFormRow>
                        <ProfileFormRow label="Email">
                            <p className="text-sm">
                                <EmailAddressText email={student.email} />
                            </p>
                        </ProfileFormRow>
                        <ProfileFormRow label="Start time">
                            <p className="text-sm tabular-nums">
                                {student.start_time ? formatLiveDateTime(student.start_time) : '—'}
                            </p>
                        </ProfileFormRow>
                        <ProfileFormRow label="End time">
                            <p className="text-sm tabular-nums">
                                {student.end_time ? formatLiveDateTime(student.end_time) : '—'}
                            </p>
                        </ProfileFormRow>
                        <ProfileFormRow label="Submission IPs" alignStart>
                            <LiveParticipantIpList ips={student.submission_ips} />
                        </ProfileFormRow>
                        <ProfileFormRow label="Login IPs" alignStart>
                            <LiveParticipantIpList ips={student.login_ips} />
                        </ProfileFormRow>
                        <ProfileFormRow label="Entered">
                            <div className="flex items-center gap-2">
                                <AnimatedToggle
                                    {...XS_BLUE_CANDY_MORPH_TOGGLE}
                                    checked={!!student.entered}
                                    disabled
                                    label="Entered"
                                />
                                <span className="text-sm text-muted-foreground">
                                    {student.entered ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </ProfileFormRow>
                        <ProfileFormRow label="Finished">
                            <div className="flex items-center gap-2">
                                <AnimatedToggle
                                    {...XS_BLUE_CANDY_MORPH_TOGGLE}
                                    checked={finished}
                                    disabled={pending}
                                    label="Finished"
                                    onChange={setFinished}
                                />
                                <span className="text-sm text-muted-foreground">{finished ? 'Yes' : 'No'}</span>
                            </div>
                        </ProfileFormRow>
                        <ProfileFormRow label="Banned">
                            <div className="flex items-center gap-2">
                                <AnimatedToggle
                                    {...XS_BLUE_CANDY_MORPH_TOGGLE}
                                    checked={banned}
                                    disabled={pending}
                                    label="Banned"
                                    onChange={setBanned}
                                />
                                <span className="text-sm text-muted-foreground">{banned ? 'Yes' : 'No'}</span>
                            </div>
                        </ProfileFormRow>
                        {contest ? (
                            <ProfileFormRow label="Invited">
                                <div className="flex items-center gap-2">
                                    <AnimatedToggle
                                        {...XS_BLUE_CANDY_MORPH_TOGGLE}
                                        checked={invited}
                                        disabled={pending}
                                        label="Invited"
                                        onChange={setInvited}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {invited ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </ProfileFormRow>
                        ) : null}
                        <ProfileFormRow label="Minutes to add (negative to remove)" htmlFor="student-minutes">
                            <Input
                                id="student-minutes"
                                type="number"
                                className="w-24 tabular-nums"
                                min={ALL_MINUTES_SLIDER_MIN}
                                max={ALL_MINUTES_SLIDER_MAX}
                                step={1}
                                value={minutes}
                                disabled={pending}
                                onChange={(event) => liveMinutesInputChange(event, setMinutes)}
                            />
                        </ProfileFormRow>
                    </dl>
                    <SmoothButton
                        className="w-full"
                        color="blue"
                        disabled={pending || !dirty}
                        loading={pending}
                        type="submit"
                        variant="candy"
                    >
                        <CheckIcon className="size-4" aria-hidden />
                        Apply
                    </SmoothButton>
                </form>
            </DialogContent>
        </Dialog>
    )
}

type LiveStudentsTableProps = {
    rows: LiveRosterEntry[]
    contest: boolean
    onRowOpen: (row: LiveRosterEntry) => void
}

function LiveStudentsTable({ rows, contest, onRowOpen }: LiveStudentsTableProps) {
    const colDefs = useMemo<ColDef<LiveRosterEntry>[]>(
        () => [
            { field: 'name', flex: 1, minWidth: 120 },
            {
                field: 'email',
                flex: 1.4,
                minWidth: 160,
                cellRenderer: (params: { data: LiveRosterEntry }) => (
                    <EmailAddressText email={params.data.email} />
                ),
            },
            {
                field: 'end_time',
                headerName: 'End',
                width: 168,
                valueGetter: (params) => {
                    const value = params.data?.end_time
                    if (!value) return '—'
                    return formatLiveDateTime(value)
                },
                cellClass: 'tabular-nums',
            },
            {
                field: 'entered',
                width: 88,
                valueGetter: (params) => flagCell(params.data?.entered),
                filter: 'agTextColumnFilter',
                filterParams: yesNoFilterParams,
            },
            {
                field: 'finished',
                width: 88,
                valueGetter: (params) => flagCell(params.data?.finished),
                filter: 'agTextColumnFilter',
                filterParams: yesNoFilterParams,
            },
            {
                field: 'banned',
                width: 88,
                valueGetter: (params) => flagCell(params.data?.banned),
                filter: 'agTextColumnFilter',
                filterParams: yesNoFilterParams,
            },
            {
                field: 'invited',
                width: 88,
                hide: !contest,
                valueGetter: (params) => flagCell(params.data?.invited),
                filter: 'agTextColumnFilter',
                filterParams: yesNoFilterParams,
            },
        ],
        [contest],
    )

    const onRowClicked = useCallback(
        (event: RowClickedEvent<LiveRosterEntry>) => {
            if (event.data) onRowOpen(event.data)
        },
        [onRowOpen],
    )

    return (
        <div className={cn('min-w-0', '[&_.ag-cell]:overflow-visible', '[&_.ag-row]:cursor-pointer')}>
            <AgTableFull
                rowData={rows}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                getRowId={(params: { data: LiveRosterEntry }) => params.data.email}
                onRowClicked={onRowClicked}
            />
        </div>
    )
}

export function LiveStudentsPage() {
    const site = useSiteMode()
    const session = useLiveSession()
    const [rows, setRows] = useState<LiveRosterEntry[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [manageStudent, setManageStudent] = useState<LiveRosterEntry | null>(null)
    const [manageOpen, setManageOpen] = useState(false)
    const [pending, setPending] = useState(false)
    const contest = site.kind === 'contest'

    async function reload() {
        const roster = await fetchLiveRoster()
        setRows(roster)
        if (manageStudent) {
            const updated = roster.find((row) => row.email === manageStudent.email)
            if (updated) setManageStudent(updated)
        }
    }

    useEffect(() => {
        if (session.loading || session.role !== 'tutor') return
        let cancelled = false
        void reload()
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load the roster.'))
            })
        return () => {
            cancelled = true
        }
    }, [session.loading, session.role])

    async function run(action: () => Promise<void>): Promise<boolean> {
        setPending(true)
        setError(null)
        try {
            await action()
            await reload()
            return true
        } catch (actionError) {
            setError(liveErrorMessage(actionError, 'The action failed.'))
            return false
        } finally {
            setPending(false)
        }
    }

    const openRow = useCallback((row: LiveRosterEntry) => {
        setManageStudent(row)
        setManageOpen(true)
    }, [])

    const applyAllMinutes = useCallback(
        (minutes: number, reason: string) =>
            run(() =>
                jutge.tutor.examctl.addMinutes({
                    minutes,
                    reason_inc: reason,
                }),
            ),
        [],
    )

    if (session.loading) return <LiveSpinner />
    if (session.role !== 'tutor') {
        return (
            <LivePage>
                <LiveNotice>
                    {session.authenticated ? 'The roster is for tutors.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage>
            <LiveStudentsToolbar pending={pending} onApplyAll={applyAllMinutes} />
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {rows === null ? <LiveSpinner /> : null}
            {rows ? <LiveStudentsTable rows={rows} contest={contest} onRowOpen={openRow} /> : null}
            <LiveStudentManageDialog
                student={manageStudent}
                open={manageOpen}
                onOpenChange={setManageOpen}
                contest={contest}
                pending={pending}
                onRun={(action) => run(action)}
            />
        </LivePage>
    )
}