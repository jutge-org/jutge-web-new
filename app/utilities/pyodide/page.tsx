'use client'

import { PyodideView } from '@/components/utilities/PyodideView'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesPyodidePage() {
    return (
        <UtilitiesPageShell
            activeTab="pyodide"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'Pyodide', url: '/utilities/pyodide' },
            ]}
            titleHidden={true}
            title="Pyodide"
            titleDescription="Run Python in the browser"
        >
            <PyodideView />
        </UtilitiesPageShell>
    )
}
