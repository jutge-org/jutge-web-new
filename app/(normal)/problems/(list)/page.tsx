'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProblemsPageContent } from '@/components/problems/ProblemsPageContent'

export default function ProblemsPage() {
    return (
        <AuthedGate>
            <ProblemsPageContent />
        </AuthedGate>
    )
}
