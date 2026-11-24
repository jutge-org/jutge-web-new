'use client'

import Link from 'next/link'
import { useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { Button } from '@/components/ui/button'
import { liveErrorMessage } from '@/lib/data/liveExam'

export function LiveFinishPage() {
    const session = useLiveSession()
    const [confirmed, setConfirmed] = useState(false)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated || session.role !== 'student') {
        return (
            <LivePage title="Finish">
                <LiveNotice>
                    {session.authenticated ? 'Tutors do not finish their own session here.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }
    return (
        <LivePage title="Finish exam">
            <p>Finishing closes your access to this exam. This cannot be undone from this page.</p>
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            <form
                className="flex flex-col items-start gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    if (!confirmed) return
                    setPending(true)
                    setError(null)
                    void session
                        .finishExamAndSignOut()
                        .catch((finishError: unknown) => {
                            setError(liveErrorMessage(finishError, 'Could not finish the exam.'))
                            setPending(false)
                        })
                }}
            >
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(event) => setConfirmed(event.target.checked)}
                    />
                    I want to finish this exam
                </label>
                <Button type="submit" disabled={!confirmed || pending}>
                    {pending ? 'Finishing…' : 'Finish exam'}
                </Button>
            </form>
        </LivePage>
    )
}
