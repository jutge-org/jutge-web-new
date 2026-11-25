'use client'

import { NavigationGuardProvider } from 'next-navigation-guard'
import type { ReactNode } from 'react'

import { InstructorGate } from '@/components/ClientGates'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorLayout({ children }: { children: ReactNode }) {
    return (
        <InstructorGate>
            <NavigationGuardProvider>
                <InstructorPageShell breadcrumbs={[{ title: 'Instructor', url: '/instructor' }]}>
                    {children}
                </InstructorPageShell>
            </NavigationGuardProvider>
        </InstructorGate>
    )
}
