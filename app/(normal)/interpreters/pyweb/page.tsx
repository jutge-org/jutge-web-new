'use client'

import { Suspense } from 'react'

import { PageSpinner } from '@/components/ClientGates'
import { InterpretersPageShell } from '@/components/interpreters/InterpretersPageShell'
import { PyWebView } from '@/components/interpreters/PyWebView'

export default function InterpretersPyWebPage() {
    return (
        <InterpretersPageShell
            activeTab="pyweb"
            breadcrumbs={[
                { title: 'Interpreters', url: '/interpreters' },
                { title: 'PyWeb', url: '/interpreters/pyweb' },
            ]}
            titleHidden={true}
            title="PyWeb"
            titleDescription="Run Python with turtle graphics"
        >
            <Suspense fallback={<PageSpinner />}>
                <PyWebView />
            </Suspense>
        </InterpretersPageShell>
    )
}
