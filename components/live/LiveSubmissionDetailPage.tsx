'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import {
    compilerLabel,
    fetchLiveSubmissionDetail,
    formatInstant,
    liveErrorMessage,
    problemNmOfKey,
    verdictLabel,
    type LiveSubmissionDetail,
} from '@/lib/data/liveExam'

export function LiveSubmissionDetailPage() {
    const params = useParams<{ key: string; submission_id: string }>()
    const session = useLiveSession()
    const [detail, setDetail] = useState<LiveSubmissionDetail | null | undefined>(undefined)
    const [error, setError] = useState<string | null>(null)
    const problemNm = problemNmOfKey(params.key)

    useEffect(() => {
        if (session.loading || session.role !== 'student' || !problemNm) return
        let cancelled = false
        void fetchLiveSubmissionDetail(problemNm, params.submission_id)
            .then((next) => {
                if (!cancelled) setDetail(next)
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load the submission.'))
            })
        return () => {
            cancelled = true
        }
    }, [session.loading, session.role, problemNm, params.submission_id])

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage title="Submission">
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see this submission.
                </LiveNotice>
            </LivePage>
        )
    }
    if (session.role !== 'student') {
        return (
            <LivePage title="Submission">
                <LiveNotice>Opening another student&apos;s source is not available during the live exam.</LiveNotice>
            </LivePage>
        )
    }
    if (!problemNm) {
        return (
            <LivePage title="Submission">
                <LiveNotice>Unknown problem.</LiveNotice>
            </LivePage>
        )
    }
    if (error) {
        return (
            <LivePage title="Submission">
                <LiveNotice>{error}</LiveNotice>
            </LivePage>
        )
    }
    if (detail === undefined) return <LiveSpinner />
    if (detail === null) {
        return (
            <LivePage title="Submission">
                <LiveNotice>This submission was not found.</LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage title={detail.submission.submission_id}>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
                <dt>Problem</dt>
                <dd>
                    <Link href={`/problems/${problemNm}`} className="underline">
                        {problemNm}
                    </Link>
                </dd>
                <dt>Time</dt>
                <dd>{formatInstant(detail.submission.time_in)}</dd>
                <dt>Verdict</dt>
                <dd>{verdictLabel(detail.tables, detail.submission.veredict)}</dd>
                <dt>Compiler</dt>
                <dd>{compilerLabel(detail.tables, detail.submission.compiler_id)}</dd>
            </dl>
            {detail.compilationErrors ? (
                <section aria-labelledby="compilation-heading">
                    <h2 id="compilation-heading" className="mb-2 text-lg font-medium">
                        Compilation
                    </h2>
                    <pre className="overflow-x-auto rounded-md border border-border p-3 text-sm whitespace-pre-wrap">
                        {detail.compilationErrors}
                    </pre>
                </section>
            ) : null}
            {detail.analysis.length > 0 ? (
                <section aria-labelledby="analysis-heading">
                    <h2 id="analysis-heading" className="mb-2 text-lg font-medium">
                        Testcases
                    </h2>
                    <table className="w-full text-sm">
                        <caption className="sr-only">Testcase verdicts</caption>
                        <thead>
                            <tr className="border-b text-left">
                                <th className="py-2 pr-3 font-medium">Testcase</th>
                                <th className="py-2 font-medium">Verdict</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detail.analysis.map((row) => (
                                <tr key={row.testcase} className="border-b">
                                    <td className="py-2 pr-3">{row.testcase}</td>
                                    <td className="py-2">{verdictLabel(detail.tables, row.verdict)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ) : null}
            <section aria-labelledby="code-heading">
                <h2 id="code-heading" className="mb-2 text-lg font-medium">
                    Code
                </h2>
                <pre className="overflow-x-auto rounded-md border border-border p-3 font-mono text-sm whitespace-pre">
                    {detail.code ?? 'The source is not available.'}
                </pre>
            </section>
        </LivePage>
    )
}
