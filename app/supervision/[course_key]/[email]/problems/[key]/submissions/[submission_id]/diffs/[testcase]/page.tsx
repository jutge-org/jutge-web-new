'use client'

import { useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { SupervisorGate } from '@/components/ClientGates'
import { ProblemDetail } from '@/components/problems/ProblemDetail'
import { ProblemWidgetCard } from '@/components/problems/ProblemWidgetCard'
import { SubmissionSourceCodeCard } from '@/components/submissions/SubmissionSourceCodeCard'
import { SubmissionTestcaseAnalysisCard } from '@/components/submissions/SubmissionTestcaseAnalysisCard'
import { SupervisionPageShell } from '@/components/supervision/SupervisionPageShell'
import { SupervisionProblemNav } from '@/components/supervision/SupervisionProblemNav'
import { useSupervisionPageMeta, supervisionContextWithMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionProblemShell } from '@/hooks/use-supervision-problem-shell'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import {
    fetchSupervisionSubmissionDetail,
    fetchSupervisionSubmissionTestcaseAnalysis,
} from '@/lib/data/supervisionSubmissions'
import type { SubmissionTestcaseAnalysisData } from '@/lib/data/submissions'
import {
    supervisionProblemSubmissionsHref,
    supervisionSubmissionCodeHref,
    supervisionSubmissionHref,
    supervisionSubmissionTestcaseDiffHref,
    supervisionSubmissionTestcaseHref,
    supervisionBaseBreadcrumbs,
    supervisionProblemBreadcrumbs,
} from '@/lib/supervision'

export default function SupervisionSubmissionTestcaseAnalysisPage() {
    return (
        <SupervisorGate>
            <SupervisionSubmissionTestcaseAnalysisPageContent />
        </SupervisorGate>
    )
}

function SupervisionSubmissionTestcaseAnalysisPageContent() {
    const params = useParams<{ key: string; submission_id: string; testcase: string }>()
    const key = params.key
    const submission_id = params.submission_id
    const testcase = params.testcase
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const shell = useSupervisionProblemShell({ key, context, includeAssets: false })
    const [testcaseAnalysis, setTestcaseAnalysis] = useState<SubmissionTestcaseAnalysisData | null | undefined>(
        undefined,
    )
    const [submissionCode, setSubmissionCode] = useState<
        | {
              code: string
              codeExtension: string | null
              codeFilename: string
              problemId: string
          }
        | null
        | undefined
    >(undefined)

    useEffect(() => {
        let cancelled = false
        setTestcaseAnalysis(undefined)

        void fetchSupervisionSubmissionTestcaseAnalysis(context, key, submission_id, testcase).then((data) => {
            if (!cancelled) setTestcaseAnalysis(data)
        })

        return () => {
            cancelled = true
        }
    }, [context, key, submission_id, testcase])

    useEffect(() => {
        let cancelled = false
        setSubmissionCode(undefined)

        void fetchSupervisionSubmissionDetail(context, key, submission_id).then((detail) => {
            if (cancelled) return
            if (!detail?.code || !detail.codeFilename) {
                setSubmissionCode(null)
                return
            }
            setSubmissionCode({
                code: detail.code,
                codeExtension: detail.codeExtension,
                codeFilename: detail.codeFilename,
                problemId: detail.submission.problem_id,
            })
        })

        return () => {
            cancelled = true
        }
    }, [context, key, submission_id])

    if (shell.detail === null) {
        notFound()
    }

    if (testcaseAnalysis === null) {
        notFound()
    }

    const problemId = submissionCode?.problemId ?? key
    const submissionHref = supervisionSubmissionHref(context, problemId, submission_id)
    const testcaseHref = supervisionSubmissionTestcaseHref(context, problemId, submission_id, testcase)
    const codeHref = supervisionSubmissionCodeHref(context, problemId, submission_id)
    const diffHref = supervisionSubmissionTestcaseDiffHref(context, problemId, submission_id, testcase)

    const breadcrumbs =
        shell.detail && shell.problem_nm
            ? supervisionProblemBreadcrumbs(
                  context,
                  key,
                  shell.detail.problem.problem_nm,
                  shell.detail.problem.title,
                  [
                      {
                          title: 'Submissions',
                          url: supervisionProblemSubmissionsHref(context, key),
                      },
                      { title: submission_id, url: submissionHref },
                      { title: testcase, url: testcaseHref },
                  ],
                  meta?.courseTitle,
              )
            : [
                  ...supervisionBaseBreadcrumbs(context, meta?.courseTitle),
                  { title: submission_id, url: submissionHref },
                  { title: testcase, url: testcaseHref },
              ]

    const analysisLoading = testcaseAnalysis === undefined
    const codeLoading = submissionCode === undefined

    return (
        <SupervisionPageShell context={context} courseTitle={meta?.courseTitle} breadcrumbs={breadcrumbs}>
            {shell.detail ? (
                <ProblemDetail
                    pageKey={key}
                    data={shell.detail}
                    status={shell.status}
                    readOnly
                    showNav={false}
                    showStatement={false}
                    showTestcases={false}
                    overlapHeader={false}
                    supervisionContext={context}
                >
                    <div className="flex flex-col gap-6">
                        <SupervisionProblemNav pageKey={key} context={context} />
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
                <ProblemDetail
                    loading
                    pageKey={key}
                    showNav={false}
                    showStatement={false}
                    showTestcases={false}
                    overlapHeader={false}
                >
                    <div className="flex flex-col gap-6">
                        <SupervisionProblemNav pageKey={key} context={context} />
                        <ProblemWidgetCard title={`Analysis of test case ${testcase}`} />
                        <ProblemWidgetCard title="Source code" />
                    </div>
                </ProblemDetail>
            )}
        </SupervisionPageShell>
    )
}
