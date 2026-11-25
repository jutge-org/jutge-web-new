'use client'

import { useEffect, useMemo, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { SupervisorGate } from '@/components/ClientGates'
import { FullscreenEditorLoading } from '@/components/general/FullscreenEditorLoading'
import { SubmissionTestcaseDiffEditor } from '@/components/submissions/SubmissionTestcaseDiffEditor'
import { useSupervisionPageMeta, supervisionContextWithMeta } from '@/hooks/use-supervision-page-meta'
import { useSupervisionParams } from '@/hooks/use-supervision-params'
import { fetchSupervisionSubmissionTestcaseAnalysis } from '@/lib/data/supervisionSubmissions'

type AnalysisData = NonNullable<Awaited<ReturnType<typeof fetchSupervisionSubmissionTestcaseAnalysis>>>

export default function SupervisionSubmissionTestcaseDiffPage() {
    return (
        <SupervisorGate>
            <SupervisionSubmissionTestcaseDiffPageContent />
        </SupervisorGate>
    )
}

function SupervisionSubmissionTestcaseDiffPageContent() {
    const params = useParams<{ key: string; submission_id: string; testcase: string }>()
    const { key, submission_id, testcase } = params
    const baseContext = useSupervisionParams()
    const meta = useSupervisionPageMeta(baseContext)
    const context = useMemo(() => supervisionContextWithMeta(baseContext, meta), [baseContext, meta])
    const [analysis, setAnalysis] = useState<AnalysisData | null | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setAnalysis(undefined)

        void fetchSupervisionSubmissionTestcaseAnalysis(context, key, submission_id, testcase).then((data) => {
            if (!cancelled) setAnalysis(data)
        })

        return () => {
            cancelled = true
        }
    }, [context, key, submission_id, testcase])

    if (analysis === undefined) {
        const studentLabel = context.studentName?.trim() || context.email
        return <FullscreenEditorLoading title={`${studentLabel} — ${submission_id} — ${testcase} diff`} />
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
            documentTitle={`${context.studentName?.trim() || context.email} — ${submission_id} — ${testcase} diff`}
        />
    )
}
