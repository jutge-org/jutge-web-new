'use client'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { WrappedApp } from '@/components/wrapped/WrappedApp'

export default function WrappedPage() {
    return (
        <AuthedGate>
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs breadcrumbs={[{ title: 'Wrapped', url: '/wrapped' }]} />
                <WrappedApp />
            </div>
        </AuthedGate>
    )
}
