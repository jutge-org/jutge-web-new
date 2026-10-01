'use client'

import { Suspense } from 'react'

import { PageSpinner } from '@/components/ClientGates'
import { InterpretersPageShell } from '@/components/interpreters/InterpretersPageShell'
import { JsCppView } from '@/components/interpreters/JsCppView'

export default function InterpretersJsCppPage() {
    return (
        <InterpretersPageShell
            activeTab="jscpp"
            breadcrumbs={[
                { title: 'Interpreters', url: '/interpreters' },
                { title: 'JSCPP', url: '/interpreters/jscpp' },
            ]}
            titleHidden={true}
            title="JSCPP"
            titleDescription="Run C++ in the browser"
        >
            <Suspense fallback={<PageSpinner />}>
                <JsCppView />
            </Suspense>
        </InterpretersPageShell>
    )
}
