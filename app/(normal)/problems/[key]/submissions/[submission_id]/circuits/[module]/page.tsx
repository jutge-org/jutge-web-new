'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { CircuitModuleEditor } from '@/components/submissions/CircuitModuleEditor'
import { CIRCUITS_COMPILER_ID } from '@/lib/circuits'
import jutge from '@/lib/jutge'
import { resolveProblemId } from '@/lib/data/problemDetail'

type PageData = {
    submissionId: string
    moduleName: string
    svg: string
}

export default function ProblemSubmissionCircuitModuleViewPage() {
    return (
        <AuthedGate>
            <ProblemSubmissionCircuitModuleViewPageContent />
        </AuthedGate>
    )
}

function ProblemSubmissionCircuitModuleViewPageContent() {
    const params = useParams<{ key: string; submission_id: string; module: string }>()
    const { key, submission_id, module } = params
    const [pageData, setPageData] = useState<PageData | null | undefined>(undefined)

    useEffect(() => {
        void (async () => {
            const problemId = await resolveProblemId(key)
            if (!problemId) {
                setPageData(null)
                return
            }

            const submission = await jutge.student.submissions
                .get({ problem_id: problemId, submission_id })
                .catch(() => null)

            if (!submission || submission.compiler_id !== CIRCUITS_COMPILER_ID || submission.state !== 'done') {
                setPageData(null)
                return
            }

            const modules = await jutge.student.submissions
                .getCircuitModules({ problem_id: submission.problem_id, submission_id })
                .catch(() => null)

            const moduleName = decodeURIComponent(module)
            const svg = modules?.[moduleName]

            if (!svg) {
                setPageData(null)
                return
            }

            setPageData({
                submissionId: submission_id,
                moduleName,
                svg,
            })
        })()
    }, [key, module, submission_id])

    if (pageData === undefined) {
        return <FullscreenEditorLoading title={`${submission_id} — ${decodeURIComponent(module)}`} />
    }

    if (!pageData) {
        notFound()
    }

    return (
        <CircuitModuleEditor submissionId={pageData.submissionId} moduleName={pageData.moduleName} svg={pageData.svg} />
    )
}
