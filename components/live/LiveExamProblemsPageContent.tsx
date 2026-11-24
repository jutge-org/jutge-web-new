'use client'

import { LivePage } from '@/components/live/LiveChrome'
import { LiveExamProblemsList } from '@/components/live/LiveExamProblemsList'
import { LiveListLayoutToggle } from '@/components/live/LiveListLayoutToggle'
import { useLiveExamListLayout } from '@/hooks/useLiveExamListLayout'
import type { RunningExam } from '@/lib/jutge_api_client'

export function LiveExamProblemsPageContent({ exam }: { exam: RunningExam }) {
    const { layout, toggleLayout } = useLiveExamListLayout('problems')

    return (
        <LivePage>
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
                <LiveListLayoutToggle layout={layout} onToggle={toggleLayout} />
            </div>
            <LiveExamProblemsList exam={exam} layout={layout} />
        </LivePage>
    )
}