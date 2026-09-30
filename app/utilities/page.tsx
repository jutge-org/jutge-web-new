'use client'

import { UtilitiesIndex } from '@/components/utilities/UtilitiesIndex'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesPage() {
    return (
        <UtilitiesPageShell activeTab="index" breadcrumbs={[{ title: 'Utilities', url: '/utilities' }]}>
            <UtilitiesIndex />
        </UtilitiesPageShell>
    )
}
