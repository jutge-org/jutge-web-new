'use client'

import { Suspense } from 'react'

import { LiveSectionHeading } from '@/components/live/LiveSectionHeading'
import { LiveExamProblemsList } from '@/components/live/LiveExamProblemsList'
import { LiveListLayoutToggle } from '@/components/live/LiveListLayoutToggle'
import { useLiveExamListLayout } from '@/hooks/useLiveExamListLayout'
import type { RunningExam } from '@/lib/jutge_api_client'

function LiveExamProblemsCardsInner({ exam }: { exam: RunningExam }) {
    const { layout, toggleLayout } = useLiveExamListLayout('problems')

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <LiveSectionHeading id="live-problems-heading" href="/problems">
                    Problems
                </LiveSectionHeading>
                <LiveListLayoutToggle layout={layout} onToggle={toggleLayout} />
            </div>
            <LiveExamProblemsList exam={exam} layout={layout} />
        </div>
    )
}

export function LiveExamProblemsCards({ exam }: { exam: RunningExam }) {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col gap-4">
                    <LiveSectionHeading id="live-problems-heading" href="/problems">
                        Problems
                    </LiveSectionHeading>
                    <LiveExamProblemsList exam={exam} layout="cards" />
                </div>
            }
        >
            <LiveExamProblemsCardsInner exam={exam} />
        </Suspense>
    )
}