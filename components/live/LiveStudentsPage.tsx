'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner, liveFieldClassName } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchLiveRoster, formatInstant, liveErrorMessage, type LiveRosterEntry } from '@/lib/data/liveExam'
import jutge from '@/lib/jutge'

export function LiveStudentsPage() {
    const site = useSiteMode()
    const session = useLiveSession()
    const [rows, setRows] = useState<LiveRosterEntry[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [reason, setReason] = useState('')
    const [minutes, setMinutes] = useState('5')
    const [allMinutes, setAllMinutes] = useState('5')
    const [allReason, setAllReason] = useState('')
    const [pending, setPending] = useState(false)
    const contest = site.kind === 'contest'

    async function reload() {
        const roster = await fetchLiveRoster()
        setRows(roster)
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

    async function run(action: () => Promise<void>) {
        setPending(true)
        setError(null)
        try {
            await action()
            await reload()
        } catch (actionError) {
            setError(liveErrorMessage(actionError, 'The action failed.'))
        } finally {
            setPending(false)
        }
    }

    if (session.loading) return <LiveSpinner />
    if (session.role !== 'tutor') {
        return (
            <LivePage title="Students">
                <LiveNotice>
                    {session.authenticated ? 'The roster is for tutors.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }

    const student = rows?.find((row) => row.email === selected) ?? null

    return (
        <LivePage title="Students">
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            <form
                className="flex flex-wrap items-end gap-3"
                onSubmit={(event) => {
                    event.preventDefault()
                    void run(() =>
                        jutge.tutor.examctl.addMinutes({
                            minutes: Number(allMinutes),
                            reason_inc: allReason.trim(),
                        }),
                    )
                }}
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="all-minutes">Minutes for everyone</Label>
                    <Input
                        id="all-minutes"
                        type="number"
                        value={allMinutes}
                        onChange={(event) => setAllMinutes(event.target.value)}
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="all-reason">Reason</Label>
                    <Input id="all-reason" value={allReason} onChange={(event) => setAllReason(event.target.value)} required />
                </div>
                <Button type="submit" disabled={pending}>
                    Apply to everyone
                </Button>
            </form>
            {rows === null ? <LiveSpinner /> : null}
            {rows ? (
                <table className="w-full text-sm">
                    <caption className="sr-only">Students in this exam</caption>
                    <thead>
                        <tr className="border-b text-left">
                            <th className="py-2 pr-3 font-medium">Name</th>
                            <th className="py-2 pr-3 font-medium">Email</th>
                            <th className="py-2 pr-3 font-medium">End</th>
                            <th className="py-2 pr-3 font-medium">Flags</th>
                            <th className="py-2 font-medium" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.email} className="border-b">
                                <td className="py-2 pr-3">{row.name}</td>
                                <td className="py-2 pr-3">{row.email}</td>
                                <td className="py-2 pr-3">{formatInstant(row.end_time)}</td>
                                <td className="py-2 pr-3">
                                    {[
                                        row.entered ? 'entered' : null,
                                        row.finished ? 'finished' : null,
                                        row.banned ? 'banned' : null,
                                        row.invited ? 'invited' : null,
                                    ]
                                        .filter(Boolean)
                                        .join(', ') || '—'}
                                </td>
                                <td className="py-2">
                                    <Button type="button" variant="outline" onClick={() => setSelected(row.email)}>
                                        Manage
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : null}
            {student ? (
                <section className="flex flex-col gap-4 border-t border-border pt-4" aria-labelledby="manage-student">
                    <h2 id="manage-student" className="text-lg font-medium">
                        {student.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <div className="flex flex-wrap gap-2">
                        {student.banned ? (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={pending}
                                onClick={() => void run(() => jutge.tutor.examctl.unban({ email: student.email }))}
                            >
                                Unban
                            </Button>
                        ) : null}
                        {student.finished ? (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={pending}
                                onClick={() => void run(() => jutge.tutor.examctl.unfinish({ email: student.email }))}
                            >
                                Reopen
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={pending}
                                onClick={() => void run(() => jutge.tutor.examctl.finish({ email: student.email }))}
                            >
                                Finish
                            </Button>
                        )}
                        {contest ? (
                            student.invited ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={pending}
                                    onClick={() => void run(() => jutge.tutor.examctl.uninvite({ email: student.email }))}
                                >
                                    Include in ranking
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={pending}
                                    onClick={() => void run(() => jutge.tutor.examctl.invite({ email: student.email }))}
                                >
                                    Invite (hide from ranking)
                                </Button>
                            )
                        ) : null}
                    </div>
                    <form
                        className="flex flex-wrap items-end gap-3"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void run(() =>
                                jutge.tutor.examctl.ban({ email: student.email, reason_ban: reason.trim() }),
                            )
                        }}
                    >
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="ban-reason">Ban reason</Label>
                            <Input id="ban-reason" value={reason} onChange={(event) => setReason(event.target.value)} required />
                        </div>
                        <Button type="submit" variant="destructive" disabled={pending}>
                            Ban
                        </Button>
                    </form>
                    <form
                        className="flex flex-wrap items-end gap-3"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void run(() =>
                                jutge.tutor.examctl.addStudentMinutes({
                                    email: student.email,
                                    minutes: Number(minutes),
                                    reason_inc: reason.trim() || 'Time change',
                                }),
                            )
                        }}
                    >
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="student-minutes">Minutes</Label>
                            <input
                                id="student-minutes"
                                className={liveFieldClassName}
                                type="number"
                                value={minutes}
                                onChange={(event) => setMinutes(event.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={pending}>
                            Change time
                        </Button>
                    </form>
                </section>
            ) : null}
        </LivePage>
    )
}
