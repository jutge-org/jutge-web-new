'use client'

import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { ProblemsSearchView } from '@/components/problems/ProblemsSearchView'

export default function ExamProblemsSearchPage() {
    return (
        <LiveSessionGate>
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs
                    breadcrumbs={[
                        { title: 'Problems', url: '/problems' },
                        { title: 'Search', url: '/problems/search' },
                    ]}
                />
                <ProblemsSearchView />
            </div>
        </LiveSessionGate>
    )
}
