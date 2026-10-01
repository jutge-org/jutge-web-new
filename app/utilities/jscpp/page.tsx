'use client'

import { Suspense } from 'react'

import { PageSpinner } from '@/components/ClientGates'
import { JsCppView } from '@/components/utilities/JsCppView'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesJsCppPage() {
    return (
        <UtilitiesPageShell
            activeTab="jscpp"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'JSCPP', url: '/utilities/jscpp' },
            ]}
            titleHidden={true}
            title="JSCPP"
            titleDescription="Run C++ in the browser"
        >
            <Suspense fallback={<PageSpinner />}>
                <JsCppView />
            </Suspense>
        </UtilitiesPageShell>
    )
}
