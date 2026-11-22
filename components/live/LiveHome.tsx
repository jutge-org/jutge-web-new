'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner, liveFieldClassName } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchReadyExams, filterReadyExams, liveErrorMessage } from '@/lib/data/liveExam'
import type { ReadyExam } from '@/lib/jutge_api_client'
import { siteBrand } from '@/lib/siteMode'

export function LiveHome() {
    const site = useSiteMode()
    const session = useLiveSession()
    const router = useRouter()
    const contest = site.kind === 'contest'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [exams, setExams] = useState<ReadyExam[] | null>(null)
    const [examKey, setExamKey] = useState('')
    const [examPassword, setExamPassword] = useState('')
    const [watchKey, setWatchKey] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        if (!session.loading && session.authenticated) {
            router.replace('/dashboard')
        }
    }, [session.loading, session.authenticated, router])

    if (session.loading || session.authenticated) return <LiveSpinner />

    async function continueToExams() {
        setError(null)
        setPending(true)
        try {
            const ready = await fetchReadyExams(email.trim(), password)
            const filtered = filterReadyExams(ready, contest)
            if (filtered.length === 0) {
                setExams(null)
                setError(contest ? 'No contest is ready for this account.' : 'No exam is ready for this account.')
                return
            }
            setExams(filtered)
            setExamKey(filtered[0]?.exam_key ?? '')
        } catch (loadError) {
            setError(liveErrorMessage(loadError, 'Could not look up exams.'))
        } finally {
            setPending(false)
        }
    }

    async function enterExam() {
        setError(null)
        setPending(true)
        const result = await session.login({
            email: email.trim(),
            password,
            exam: examKey,
            exam_password: examPassword,
        })
        setPending(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.replace('/dashboard')
    }

    return (
        <LivePage title={siteBrand(site.kind)}>
            <p className="text-muted-foreground">
                {contest
                    ? 'Sign in to take part, or watch a public ranking.'
                    : 'Sign in with your Jutge account to enter an exam.'}
            </p>
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
            <form
                className="flex max-w-md flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    if (exams) void enterExam()
                    else void continueToExams()
                }}
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="live-email">Email</Label>
                    <Input
                        id="live-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={exams !== null || pending}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="live-password">Password</Label>
                    <Input
                        id="live-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={exams !== null || pending}
                    />
                </div>
                {exams ? (
                    <>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="live-exam">{contest ? 'Contest' : 'Exam'}</Label>
                            <select
                                id="live-exam"
                                className={liveFieldClassName}
                                value={examKey}
                                onChange={(event) => setExamKey(event.target.value)}
                            >
                                {exams.map((exam) => (
                                    <option key={exam.exam_key} value={exam.exam_key}>
                                        {exam.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="live-exam-password">Exam password</Label>
                            <Input
                                id="live-exam-password"
                                type="password"
                                autoComplete="off"
                                value={examPassword}
                                onChange={(event) => setExamPassword(event.target.value)}
                            />
                        </div>
                    </>
                ) : null}
                <div className="flex gap-2">
                    <Button type="submit" disabled={pending}>
                        {pending ? 'Please wait…' : exams ? 'Enter' : 'Continue'}
                    </Button>
                    {exams ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setExams(null)
                                setExamPassword('')
                                setError(null)
                            }}
                        >
                            Back
                        </Button>
                    ) : null}
                </div>
            </form>
            {contest ? (
                <form
                    className="flex max-w-md flex-col gap-4 border-t border-border pt-6"
                    onSubmit={(event) => {
                        event.preventDefault()
                        const key = watchKey.trim()
                        if (!key) return
                        router.push(`/watch/${key}`)
                    }}
                >
                    <h2 className="text-lg font-medium">Watch a contest</h2>
                    <p className="text-sm text-muted-foreground">
                        Enter the contest key (username:exam name). A public ranking list is not available yet.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="watch-key">Contest key</Label>
                        <Input
                            id="watch-key"
                            value={watchKey}
                            onChange={(event) => setWatchKey(event.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" variant="outline">
                        Watch
                    </Button>
                </form>
            ) : null}
        </LivePage>
    )
}
