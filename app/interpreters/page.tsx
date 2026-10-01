'use client'

import { InterpretersIndex } from '@/components/interpreters/InterpretersIndex'
import { InterpretersPageShell } from '@/components/interpreters/InterpretersPageShell'

export default function InterpretersPage() {
    return (
        <InterpretersPageShell activeTab="index" breadcrumbs={[{ title: 'Interpreters', url: '/interpreters' }]}>
            <InterpretersIndex />
        </InterpretersPageShell>
    )
}
