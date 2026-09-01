'use client'

import { useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { SupervisorGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { SubmissionCodeEditor } from '@/components/submissions/SubmissionCodeEditor'
import { useSupervisionPageMeta, supervisionContextWithMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import { fetchProblemShell, resolveProblemId } from '@/lib/data/problemDetail'
import {
    fetchSupervisionSubmissionDetail,
    fetchSupervisionSubmissionsForProblem,
} from '@/lib/data/supervisionSubmissions'
import { parseProblemKey } from '@/lib/problems'
import { buildSupervisionSubmissionNavLinks, supervisionSubmissionCodeHref } from '@/lib/supervision'

type PageData = {
    code: string
    codeExtension: string
    codeFilename: string
    codeHref: string
    title: string
    submissionId: string
    verdict: string
    verdictEmoji: string
    verdictFullName: string
    navigation: ReturnType<typeof buildSupervisionSubmissionNavLinks>
    isPending: boolean
}

export default function SupervisionSubmissionCodePage() {
    return (
        <SupervisorGate>
            <SupervisionSubmissionCodePageContent />
        </SupervisorGate>
    )
}

function SupervisionSubmissionCodePageContent() {
    const params = useParams<{ key: string; submission_id: string }>()
    const key = params.key
    const submission_id = params.submission_id
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const [pageData, setPageData] = useState<PageData | null | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setPageData(undefined)

        void (async () => {
            try {
                const problemId = await resolveProblemId(key)
                if (!problemId) {
                    if (!cancelled) setPageData(null)
                    return
                }

                const data = await fetchProblemShell(problemId)
                if (!data) {
                    if (!cancelled) setPageData(null)
                    return
                }

                const parsed = parseProblemKey(problemId)
                const problem_nm = parsed.kind === 'problem_id' ? parsed.problem_nm : data.problem.problem_nm
                const title = `${data.problem.problem_nm} — ${data.problem.title}`

                const [submissionDetail, problemSubmissions] = await Promise.all([
                    fetchSupervisionSubmissionDetail(context, key, submission_id),
                    fetchSupervisionSubmissionsForProblem(context, problem_nm),
                ])

                if (!submissionDetail?.code || !submissionDetail.codeFilename) {
                    if (!cancelled) setPageData(null)
                    return
                }

                const doneSubmissions = problemSubmissions.filter((submission) => submission.state === 'done')
                const navigation = buildSupervisionSubmissionNavLinks(
                    doneSubmissions,
                    submission_id,
                    context,
                    key,
                    '/code',
                )
                const codeHref = supervisionSubmissionCodeHref(
                    context,
                    submissionDetail.submission.problem_id,
                    submission_id,
                )

                if (!cancelled) {
                    setPageData({
                        code: submissionDetail.code,
                        codeExtension: submissionDetail.codeExtension ?? '',
                        codeFilename: submissionDetail.codeFilename,
                        codeHref,
                        title,
                        submissionId: submission_id,
                        verdict: submissionDetail.verdict,
                        verdictEmoji: submissionDetail.verdictEmoji ?? '',
                        verdictFullName: submissionDetail.verdictFullName ?? '',
                        navigation,
                        isPending: submissionDetail.verdict === 'Pending',
                    })
                }
            } catch {
                if (!cancelled) setPageData(null)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [context, key, submission_id])

    if (pageData === undefined) {
        return <FullscreenEditorLoading title={`${submission_id} — source code`} />
    }

    if (!pageData) {
        notFound()
    }

    const studentLabel = context.studentName?.trim() || context.email

    return (
        <SubmissionCodeEditor
            code={pageData.code}
            codeExtension={pageData.codeExtension}
            codeFilename={pageData.codeFilename}
            codeHref={pageData.codeHref}
            title={`${studentLabel} — ${pageData.title}`}
            submissionId={pageData.submissionId}
            verdict={pageData.verdict}
            verdictEmoji={pageData.verdictEmoji}
            verdictFullName={pageData.verdictFullName}
            navigation={pageData.navigation}
            isPending={pageData.isPending}
        />
    )
}
