'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { fetchMultipleIps, formatInstant, liveErrorMessage } from '@/lib/data/liveExam'

type LoginRow = Awaited<ReturnType<typeof fetchMultipleIps>>

export function LiveLoginsPage() {
    const session = useLiveSession()
    const [rows, setRows] = useState<LoginRow | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (session.loading || session.role !== 'tutor') return
        let cancelled = false
        void fetchMultipleIps()
            .then((next) => {
                if (!cancelled) setRows(next)
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load logins.'))
            })
        return () => {
            cancelled = true
        }
    }, [session.loading, session.role])

    if (session.loading) return <LiveSpinner />
    if (session.role !== 'tutor') {
        return (
            <LivePage title="Logins">
                <LiveNotice>
                    {session.authenticated ? 'Login review is for tutors.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }
    if (error) {
        return (
            <LivePage title="Logins">
                <LiveNotice>{error}</LiveNotice>
            </LivePage>
        )
    }
    if (!rows) return <LiveSpinner />

    return (
        <LivePage title="Logins">
            <p className="text-muted-foreground">Students who signed in from more than one IP address.</p>
            {rows.length === 0 ? <LiveNotice>No student has logged in from more than one IP.</LiveNotice> : null}
            {rows.length > 0 ? (
                <ul className="flex flex-col gap-4">
                    {rows.map((row) => (
                        <li key={row.email}>
                            <h2 className="font-medium">
                                {row.name} <span className="font-normal text-muted-foreground">{row.email}</span>
                            </h2>
                            <ul className="mt-1 text-sm">
                                {row.ips.map((entry) => (
                                    <li key={`${entry.ip}-${entry.at}`}>
                                        {entry.ip} · {formatInstant(entry.at)}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            ) : null}
        </LivePage>
    )
}
