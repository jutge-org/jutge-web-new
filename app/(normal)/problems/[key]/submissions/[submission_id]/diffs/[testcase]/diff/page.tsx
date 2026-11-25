'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { SubmissionTestcaseDiffEditor } from '@/components/submissions/SubmissionTestcaseDiffEditor'
import jutge from '@/lib/jutge'
import { fetchSubmissionTestcaseAnalysis } from '@/lib/data/submissions'

type AnalysisData = NonNullable<Awaited<ReturnType<typeof fetchSubmissionTestcaseAnalysis>>>

export default function ProblemSubmissionTestcaseDiffViewPage() {
    return (
        <AuthedGate>
            <ProblemSubmissionTestcaseDiffViewPageContent />
        </AuthedGate>
    )
}

function ProblemSubmissionTestcaseDiffViewPageContent() {
    const params = useParams<{ key: string; submission_id: string; testcase: string }>()
    const { key, submission_id, testcase } = params
    const [analysis, setAnalysis] = useState<AnalysisData | null | undefined>(undefined)

    useEffect(() => {
        void fetchSubmissionTestcaseAnalysis(jutge, key, submission_id, testcase).then(setAnalysis)
    }, [key, submission_id, testcase])

    if (analysis === undefined) {
        return <FullscreenEditorLoading title={`${submission_id} — ${testcase} diff`} />
    }

    if (!analysis) {
        notFound()
    }

    return (
        <SubmissionTestcaseDiffEditor
            input={analysis.input}
            output={analysis.output}
            expected={analysis.expected}
            outputImageSrc={analysis.outputImageSrc}
            expectedImageSrc={analysis.expectedImageSrc}
            documentTitle={`${submission_id} — ${testcase} diff`}
        />
    )
}
