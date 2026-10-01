'use client'

import { InterpretersPageShell } from '@/components/interpreters/InterpretersPageShell'
import { PyodideView } from '@/components/interpreters/PyodideView'

export default function InterpretersPyodidePage() {
    return (
        <InterpretersPageShell
            activeTab="pyodide"
            breadcrumbs={[
                { title: 'Interpreters', url: '/interpreters' },
                { title: 'Pyodide', url: '/interpreters/pyodide' },
            ]}
            titleHidden={true}
            title="Pyodide"
            titleDescription="Run Python in the browser"
        >
            <PyodideView />
        </InterpretersPageShell>
    )
}
