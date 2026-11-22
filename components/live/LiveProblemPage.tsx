'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner, liveFieldClassName } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { ProblemStatement } from '@/components/problems/ProblemStatement'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    fetchLiveProblemView,
    fetchTutorProblemView,
    liveErrorMessage,
    problemBelongsToExam,
    problemNmOfKey,
    submitLiveSolution,
    type LiveProblemView,
} from '@/lib/data/liveExam'

export function LiveProblemPage() {
    const params = useParams<{ key: string }>()
    const key = params.key
    const router = useRouter()
    const session = useLiveSession()
    const [view, setView] = useState<LiveProblemView | null | undefined>(undefined)
    const [error, setError] = useState<string | null>(null)
    const [compilerId, setCompilerId] = useState('')
    const [code, setCode] = useState('')
    const [annotation, setAnnotation] = useState('')
    const [pending, setPending] = useState(false)

    const problemNm = problemNmOfKey(key)
    const blocked =
        session.role === 'student' &&
        session.exam !== null &&
        problemNm !== null &&
        !problemBelongsToExam(session.exam, problemNm)

    useEffect(() => {
        if (session.loading || !session.authenticated || blocked || !problemNm) return
        if (session.role === 'student' && session.exam === null) return
        let cancelled = false
        const load =
            session.role === 'tutor'
                ? fetchTutorProblemView(key)
                : fetchLiveProblemView(key, session.exam?.compilers ?? [])
        void load
            .then((next) => {
                if (cancelled) return
                setView(next)
                setCompilerId(next?.compilers[0]?.compiler_id ?? '')
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load the problem.'))
            })
        return () => {
            cancelled = true
        }
    }, [session.loading, session.authenticated, session.role, session.exam, blocked, key, problemNm])

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage title="Problem">
                <LiveNotice>
                    <Link href="/">Sign in</Link> to open this problem.
                </LiveNotice>
            </LivePage>
        )
    }
    if (session.role === 'student' && session.exam === null) return <LiveSpinner />
    if (!problemNm || blocked) {
        return (
            <LivePage title="Problem">
                <LiveNotice>This problem is not part of the exam.</LiveNotice>
            </LivePage>
        )
    }
    if (error) {
        return (
            <LivePage title={problemNm}>
                <LiveNotice>{error}</LiveNotice>
            </LivePage>
        )
    }
    if (view === undefined) return <LiveSpinner />
    if (view === null) {
        return (
            <LivePage title={problemNm}>
                <LiveNotice>This problem could not be loaded.</LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage title={view.title}>
            <ProblemStatement
                pageKey={key}
                problemId={view.problemId}
                shortHtmlStatement={view.shortHtmlStatement}
                templates={view.templates}
            />
            {session.role === 'student' ? (
                <form
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                        event.preventDefault()
                        setPending(true)
                        setError(null)
                        void submitLiveSolution({
                            problemId: view.problemId,
                            compilerId,
                            code,
                            annotation,
                        })
                            .then((submissionId) => {
                                router.push(`/problems/${view.problemNm}/submissions/${submissionId}`)
                            })
                            .catch((submitError: unknown) => {
                                setError(liveErrorMessage(submitError, 'Could not submit.'))
                                setPending(false)
                            })
                    }}
                >
                    <h2 className="text-lg font-medium">Submit</h2>
                    {error ? <LiveNotice>{error}</LiveNotice> : null}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="live-compiler">Compiler</Label>
                        <select
                            id="live-compiler"
                            className={liveFieldClassName}
                            value={compilerId}
                            onChange={(event) => setCompilerId(event.target.value)}
                            required
                        >
                            {view.compilers.length === 0 ? <option value="">No compiler is available</option> : null}
                            {view.compilers.map((compiler) => (
                                <option key={compiler.compiler_id} value={compiler.compiler_id}>
                                    {compiler.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="live-code">Code</Label>
                        <Textarea
                            id="live-code"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            required
                            rows={16}
                            className="font-mono"
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="live-annotation">Annotation</Label>
                        <Textarea
                            id="live-annotation"
                            value={annotation}
                            onChange={(event) => setAnnotation(event.target.value)}
                            rows={2}
                        />
                    </div>
                    <Button type="submit" disabled={pending || !compilerId}>
                        {pending ? 'Submitting…' : 'Submit'}
                    </Button>
                </form>
            ) : null}
            <p>
                <Link href={`/problems/${view.problemNm}/submissions`} className="underline">
                    Submissions
                </Link>
            </p>
        </LivePage>
    )
}
