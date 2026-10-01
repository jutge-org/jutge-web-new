'use client'

import { Suspense } from 'react'

import { PageSpinner } from '@/components/ClientGates'
import { PyWebView } from '@/components/utilities/PyWebView'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesPyWebPage() {
    return (
        <UtilitiesPageShell
            activeTab="pyweb"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'PyWeb', url: '/utilities/pyweb' },
            ]}
            titleHidden={true}
            title="PyWeb"
            titleDescription="Run Python with turtle graphics"
        >
            <Suspense fallback={<PageSpinner />}>
                <PyWebView />
            </Suspense>
        </UtilitiesPageShell>
    )
}
