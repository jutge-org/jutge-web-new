'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { SubmissionCodeEditor } from '@/components/submissions/SubmissionCodeEditor'
import jutge from '@/lib/jutge'
import { parseProblemKey } from '@/lib/problems'
import { buildSubmissionNavLinks } from '@/lib/submissions'
import { fetchProblemShell, resolveProblemId } from '@/lib/data/problemDetail'
import { fetchSubmissionDetail } from '@/lib/data/submissions'

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
    navigation: ReturnType<typeof buildSubmissionNavLinks>
    isPending: boolean
}

export default function ProblemSubmissionCodeViewPage() {
    return (
        <AuthedGate>
            {(user) => <ProblemSubmissionCodeViewPageContent isAdministrator={user.administrator} />}
        </AuthedGate>
    )
}

function ProblemSubmissionCodeViewPageContent({ isAdministrator }: { isAdministrator: boolean }) {
    const params = useParams<{ key: string; submission_id: string }>()
    const key = params.key
    const submission_id = params.submission_id
    const [pageData, setPageData] = useState<PageData | null | undefined>(undefined)

    useEffect(() => {
        void (async () => {
            const problemId = await resolveProblemId(key)
            if (!problemId) {
                setPageData(null)
                return
            }

            const data = await fetchProblemShell(problemId)
            if (!data) {
                setPageData(null)
                return
            }

            const parsed = parseProblemKey(problemId)
            const problem_nm = parsed.kind === 'problem_id' ? parsed.problem_nm : data.problem.problem_nm
            const title = `${data.problem.problem_nm} — ${data.problem.title}`

            const isExamOrContest = await jutge.student.exam.get().then(
                () => true,
                () => false,
            )

            const [submissionDetail, problemSubmissions] = await Promise.all([
                fetchSubmissionDetail(jutge, key, submission_id, {
                    isAdministrator,
                    isExamOrContest,
                }),
                jutge.student.submissions.getForAbstractProblems(problem_nm),
            ])

            if (!submissionDetail?.code || !submissionDetail.codeFilename) {
                setPageData(null)
                return
            }

            const doneSubmissions = problemSubmissions.filter((submission) => submission.state === 'done')
            const navigation = buildSubmissionNavLinks(doneSubmissions, submission_id, key, '/code')
            const submissionHref = `/problems/${key}/submissions/${submission_id}`
            const codeHref = `${submissionHref}/code`

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
        })()
    }, [isAdministrator, key, submission_id])

    if (pageData === undefined) {
        return <FullscreenEditorLoading title={`${submission_id} — source code`} />
    }

    if (!pageData) {
        notFound()
    }

    return (
        <SubmissionCodeEditor
            code={pageData.code}
            codeExtension={pageData.codeExtension}
            codeFilename={pageData.codeFilename}
            codeHref={pageData.codeHref}
            title={pageData.title}
            submissionId={pageData.submissionId}
            verdict={pageData.verdict}
            verdictEmoji={pageData.verdictEmoji}
            verdictFullName={pageData.verdictFullName}
            navigation={pageData.navigation}
            isPending={pageData.isPending}
        />
    )
}
