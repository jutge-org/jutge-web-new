'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { DebugInformationEditor } from '@/components/submissions/DebugInformationEditor'
import jutge from '@/lib/jutge'
import { getDebugInformationFields, hasDebugInformation } from '@/lib/debugInformation'
import { parseProblemKey } from '@/lib/problems'
import { buildSubmissionNavLinks } from '@/lib/submissions'
import { fetchInstructorOwnsProblem, fetchProblemShell, resolveProblemId } from '@/lib/data/problemDetail'
import { fetchSubmissionDetail } from '@/lib/data/submissions'

type PageData = {
    fields: ReturnType<typeof getDebugInformationFields>
    problemId: string
    submissionId: string
    verdict: string
    verdictEmoji: string
    verdictFullName: string
    isPending: boolean
    navigation: ReturnType<typeof buildSubmissionNavLinks>
}

export default function ProblemSubmissionDebugViewPage() {
    return (
        <AuthedGate>
            {(user) => <ProblemSubmissionDebugViewPageContent isAdministrator={user.administrator} />}
        </AuthedGate>
    )
}

function ProblemSubmissionDebugViewPageContent({ isAdministrator }: { isAdministrator: boolean }) {
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

            const isInstructorOwner = await fetchInstructorOwnsProblem(problem_nm)
            if (!isInstructorOwner && !isAdministrator) {
                setPageData(null)
                return
            }

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

            if (!submissionDetail || submissionDetail.submission.state !== 'done') {
                setPageData(null)
                return
            }

            const { submission } = submissionDetail
            const debugInformation = await jutge.student.submissions
                .getDebugInformation({
                    problem_id: submission.problem_id,
                    submission_id,
                })
                .catch(() => null)

            if (!hasDebugInformation(debugInformation) || !debugInformation) {
                setPageData(null)
                return
            }

            const fields = getDebugInformationFields(debugInformation)
            if (fields.length === 0) {
                setPageData(null)
                return
            }

            const doneSubmissions = problemSubmissions.filter((row) => row.state === 'done')
            const navigation = buildSubmissionNavLinks(doneSubmissions, submission_id, key, '/debug/view')

            setPageData({
                fields,
                problemId: submission.problem_id,
                submissionId: submission.submission_id,
                verdict: submissionDetail.verdict,
                verdictEmoji: submissionDetail.verdictEmoji ?? '',
                verdictFullName: submissionDetail.verdictFullName ?? '',
                isPending: submissionDetail.verdict === 'Pending',
                navigation,
            })
        })()
    }, [isAdministrator, key, submission_id])

    if (pageData === undefined) {
        return <FullscreenEditorLoading title={`${submission_id} — debug information`} />
    }

    if (!pageData) {
        notFound()
    }

    return (
        <DebugInformationEditor
            fields={pageData.fields}
            problemId={pageData.problemId}
            submissionId={pageData.submissionId}
            verdict={pageData.verdict}
            verdictEmoji={pageData.verdictEmoji}
            verdictFullName={pageData.verdictFullName}
            isPending={pageData.isPending}
            navigation={pageData.navigation}
        />
    )
}
