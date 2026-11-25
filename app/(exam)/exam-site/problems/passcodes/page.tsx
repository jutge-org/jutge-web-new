'use client'

import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { ProblemPasscodesView } from '@/components/problems/ProblemPasscodesView'

export default function ExamProblemPasscodesPage() {
    return (
        <LiveSessionGate>
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs
                    breadcrumbs={[
                        { title: 'Problems', url: '/problems' },
                        { title: 'Passcodes', url: '/problems/passcodes' },
                    ]}
                />
                <ProblemPasscodesView />
            </div>
        </LiveSessionGate>
    )
}
