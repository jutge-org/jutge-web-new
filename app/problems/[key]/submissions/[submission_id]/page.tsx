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
import { fetchSubmissionDetail, type SubmissionDetailData } from '@/lib/data/submissions'

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
    const shell = useProblemShell({ key, isAuthenticated: true })
    const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetailData | null | undefined>(undefined)
    const [navigation, setNavigation] = useState<SubmissionNavLinks | null | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setSubmissionDetail(undefined)

        void (async () => {
            const isExamOrContest = await jutge.student.exam.get().then(
                () => true,
                () => false,
            )
            const detail = await fetchSubmissionDetail(jutge, key, submission_id, {
                isAdministrator,
                isExamOrContest,
            })
            if (!cancelled) setSubmissionDetail(detail)
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

    if (submissionDetail === null) {
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
    const submissionLoading = submissionDetail === undefined

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
                    {submissionLoading ? (
                        <SubmissionDetailView loading submissionId={submission_id} />
                    ) : (
                        <>
                            <SubmissionPendingRefresh isPending={submissionDetail!.verdict === 'Pending'} />
                            <SubmissionDetailView
                                data={submissionDetail!}
                                codeHref={codeHref}
                                debugHref={debugHref}
                                problemKey={key}
                                navigation={navigation ?? null}
                            />
                        </>
                    )}
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showStatement={false} showTestcases={false}>
                    <SubmissionDetailView loading submissionId={submission_id} />
                </ProblemDetail>
            )}
        </div>
    )
}
