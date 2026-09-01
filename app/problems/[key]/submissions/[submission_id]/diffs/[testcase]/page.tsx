'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { ProblemWidgetCard } from '@/components/problems/ProblemWidgetCard'
import { SubmissionSourceCodeCard } from '@/components/submissions/SubmissionSourceCodeCard'
import { SubmissionTestcaseAnalysisCard } from '@/components/submissions/SubmissionTestcaseAnalysisCard'
import { useProblemShell } from '@/hooks/useProblemShell'
import jutge from '@/lib/jutge'
import { problemLoadedBreadcrumbs, problemTrailBreadcrumbs } from '@/lib/problemBreadcrumbs'
import {
    fetchSubmissionDetail,
    fetchSubmissionTestcaseAnalysis,
    type SubmissionTestcaseAnalysisData,
} from '@/lib/data/submissions'

export default function ProblemSubmissionTestcaseAnalysisPage() {
    return (
        <AuthedGate>
            {(user) => <ProblemSubmissionTestcaseAnalysisPageContent isAdministrator={user.administrator} />}
        </AuthedGate>
    )
}

function ProblemSubmissionTestcaseAnalysisPageContent({ isAdministrator }: { isAdministrator: boolean }) {
    const params = useParams<{ key: string; submission_id: string; testcase: string }>()
    const key = params.key
    const submission_id = params.submission_id
    const testcase = params.testcase
    const submissionHref = `/problems/${key}/submissions/${submission_id}`
    const testcaseHref = `${submissionHref}/diffs/${testcase}`
    const shell = useProblemShell({ key, isAuthenticated: true, includeAssets: false })
    const [testcaseAnalysis, setTestcaseAnalysis] = useState<SubmissionTestcaseAnalysisData | null | undefined>(
        undefined,
    )
    const [submissionCode, setSubmissionCode] = useState<
        | {
              code: string
              codeExtension: string | null
              codeFilename: string
          }
        | null
        | undefined
    >(undefined)

    useEffect(() => {
        let cancelled = false
        setTestcaseAnalysis(undefined)

        void fetchSubmissionTestcaseAnalysis(jutge, key, submission_id, testcase).then((data) => {
            if (!cancelled) setTestcaseAnalysis(data)
        })

        return () => {
            cancelled = true
        }
    }, [key, submission_id, testcase])

    useEffect(() => {
        let cancelled = false
        setSubmissionCode(undefined)

        void (async () => {
            const isExamOrContest = await jutge.student.exam.get().then(
                () => true,
                () => false,
            )
            const detail = await fetchSubmissionDetail(jutge, key, submission_id, {
                isAdministrator,
                isExamOrContest,
            })
            if (cancelled) return
            if (!detail?.code || !detail.codeFilename) {
                setSubmissionCode(null)
                return
            }
            setSubmissionCode({
                code: detail.code,
                codeExtension: detail.codeExtension,
                codeFilename: detail.codeFilename,
            })
        })()

        return () => {
            cancelled = true
        }
    }, [isAdministrator, key, submission_id])

    if (shell.detail === null) {
        notFound()
    }

    if (testcaseAnalysis === null) {
        notFound()
    }

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? problemLoadedBreadcrumbs(key, shell.detail.problem.problem_nm, shell.detail.problem.title, [
                  { title: 'Submissions', url: `/problems/${key}/submissions` },
                  { title: submission_id, url: submissionHref },
                  { title: testcase, url: testcaseHref },
              ])
            : problemTrailBreadcrumbs(key, [
                  { title: 'Submissions', url: `/problems/${key}/submissions` },
                  { title: submission_id, url: submissionHref },
                  { title: testcase, url: testcaseHref },
              ])

    const codeHref = `${submissionHref}/code`
    const diffHref = `${testcaseHref}/diff`
    const analysisLoading = testcaseAnalysis === undefined
    const codeLoading = submissionCode === undefined

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
                    <div className="flex flex-col gap-6">
                        {analysisLoading ? (
                            <ProblemWidgetCard title={`Analysis of test case ${testcase}`} />
                        ) : (
                            <SubmissionTestcaseAnalysisCard data={testcaseAnalysis!} diffHref={diffHref} />
                        )}
                        {codeLoading ? (
                            <ProblemWidgetCard title="Source code" />
                        ) : submissionCode ? (
                            <SubmissionSourceCodeCard
                                code={submissionCode.code}
                                codeExtension={submissionCode.codeExtension}
                                codeFilename={submissionCode.codeFilename}
                                codeHref={codeHref}
                            />
                        ) : null}
                    </div>
                </ProblemDetail>
            ) : (
                <ProblemDetail loading pageKey={key} showStatement={false} showTestcases={false}>
                    <div className="flex flex-col gap-6">
                        <ProblemWidgetCard title={`Analysis of test case ${testcase}`} />
                        <ProblemWidgetCard title="Source code" />
                    </div>
                </ProblemDetail>
            )}
        </div>
    )
}
