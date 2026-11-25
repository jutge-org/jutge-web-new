'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import CoursesView from '@/components/administrator/courses/CoursesView'

export default function AdministratorCoursesPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Courses', url: '/administrator/courses' },
                ]}
            >
                <CoursesView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
