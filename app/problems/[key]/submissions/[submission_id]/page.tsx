'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { SubmissionDetailView } from '@/components/submissions/SubmissionDetailView'
import { SubmissionPendingRefresh } from '@/components/submissions/SubmissionPendingRefresh'
import { hasInstructorProblemAccess, useProblemShell } from '@/hooks/useProblemShell'
import jutge from '@/lib/jutge'
import { buildSubmissionNavLinks, type SubmissionNavLinks } from '@/lib/submissions'
import { problemLoadedBreadcrumbs, problemTrailBreadcrumbs } from '@/lib/problemBreadcrumbs'
import type { SubmissionCodeMetricsData } from '@/lib/codeMetrics'
import {
    EMPTY_SUBMISSION_SECTIONS,
    fetchSubmissionCodeMetricsForDetail,
    fetchSubmissionDetailCore,
    fetchSubmissionSections,
    fetchSubmissionSource,
    type SubmissionDetailCore,
    type SubmissionDetailSections,
    type SubmissionSourceContent,
} from '@/lib/data/submissions'

export default function ProblemSubmissionDetailPage() {
    return (
        <AuthedGate>{(user) => <ProblemSubmissionDetailPageContent isAdministrator={user.administrator} />}</AuthedGate>
    )
}

function ProblemSubmissionDetailPageContent({ isAdministrator }: { isAdministrator: boolean }) {
    const params = useParams<{ key: string; submission_id: string }>()
    const key = params.key
    const submission_id = params.submission_id
    const submissionHref = `/problems/${key}/submissions/${submission_id}`
    const shell = useProblemShell({ key, isAuthenticated: true, includeAssets: false })
    const [core, setCore] = useState<SubmissionDetailCore | null | undefined>(undefined)
    const [sections, setSections] = useState<SubmissionDetailSections | undefined>(undefined)
    const [source, setSource] = useState<SubmissionSourceContent | null | undefined>(undefined)
    const [codeMetrics, setCodeMetrics] = useState<SubmissionCodeMetricsData | null | undefined>(undefined)
    const [navigation, setNavigation] = useState<SubmissionNavLinks | null | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setCore(undefined)
        setSections(undefined)
        setSource(undefined)
        setCodeMetrics(undefined)

        const examPromise = jutge.student.exam.get().then(
            () => true,
            () => false,
        )

        void (async () => {
            const resolved = await fetchSubmissionDetailCore(jutge, key, submission_id)
            if (cancelled) return
            if (!resolved) {
                setCore(null)
                return
            }

            setCore(resolved.core)

            const { submission } = resolved.core
            if (submission.state !== 'done') {
                setSections(EMPTY_SUBMISSION_SECTIONS)
                setSource(null)
                setCodeMetrics(null)
                return
            }

            void fetchSubmissionSections(jutge, submission, resolved.tables).then((result) => {
                if (!cancelled) setSections(result)
            })
            void fetchSubmissionSource(jutge, submission, resolved.tables).then((result) => {
                if (!cancelled) setSource(result)
            })
            void examPromise.then((isExamOrContest) =>
                fetchSubmissionCodeMetricsForDetail(jutge, submission, resolved.core.verdict, {
                    isAdministrator,
                    isExamOrContest,
                }).then((result) => {
                    if (!cancelled) setCodeMetrics(result)
                }),
            )
        })()

        return () => {
            cancelled = true
        }
    }, [isAdministrator, key, submission_id])

    useEffect(() => {
        if (!shell.problem_nm) return

        let cancelled = false
        setNavigation(undefined)

        void jutge.student.submissions.getForAbstractProblems(shell.problem_nm).then((submissions) => {
            if (!cancelled) {
                setNavigation(buildSubmissionNavLinks(submissions, submission_id, key))
            }
        })

        return () => {
            cancelled = true
        }
    }, [key, shell.problem_nm, submission_id])

    if (shell.detail === null) {
        notFound()
    }

    if (core === null) {
        notFound()
    }

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? problemLoadedBreadcrumbs(key, shell.detail.problem.problem_nm, shell.detail.problem.title, [
                  { title: 'Submissions', url: `/problems/${key}/submissions` },
                  { title: submission_id, url: submissionHref },
              ])
            : problemTrailBreadcrumbs(key, [
                  { title: 'Submissions', url: `/problems/${key}/submissions` },
                  { title: submission_id, url: submissionHref },
              ])

    const codeHref = `${submissionHref}/code`
    const access = hasInstructorProblemAccess(shell.isInstructorOwner, isAdministrator)
    const debugHref = access === true ? `${submissionHref}/debug/view` : undefined
    const submissionView = !core ? (
        <SubmissionDetailView loading submissionId={submission_id} />
    ) : (
        <>
            <SubmissionPendingRefresh isPending={core.verdict === 'Pending'} />
            <SubmissionDetailView
                data={core}
                sections={sections}
                source={source}
                codeMetrics={codeMetrics}
                codeHref={codeHref}
                debugHref={debugHref}
                problemKey={key}
                navigation={navigation ?? null}
            />
        </>
    )

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            {shell.detail ? (
                <ProblemDetail
                    pageKey={key}
                    data={shell.detail}
                    status={shell.status}
                    defaultCompilerId={shell.defaultCompilerId}
                    isInstructorOwner={shell.isInstructorOwner ?? false}
                    isAdministrator={isAdministrator}
                    showStatement={false}
                    showTestcases={false}
                >
                    {submissionView}
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showStatement={false} showTestcases={false}>
                    {submissionView}
                </ProblemDetail>
            )}
        </div>
    )
}
