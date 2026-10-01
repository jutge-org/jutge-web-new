'use client'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { WrappedApp } from '@/components/wrapped/WrappedApp'

export default function ActivityWrappedPage() {
    return (
        <AuthedGate>
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs
                    breadcrumbs={[
                        { title: 'Activity', url: '/activity' },
                        { title: 'Jutge Wrapped', url: '/activity/wrapped' },
                    ]}
                />
                <WrappedApp />
            </div>
        </AuthedGate>
    )
}
