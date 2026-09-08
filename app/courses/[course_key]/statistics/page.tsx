'use client'

import { AuthedGate } from '@/components/ClientGates'
import { CourseInConstruction, CourseManageShell } from '@/components/courses/CourseManageShell'

export default function CourseStatisticsPage() {
    return (
        <AuthedGate>
            {(user) => (
                <CourseManageShell userId={user.id}>
                    <CourseInConstruction />
                </CourseManageShell>
            )}
        </AuthedGate>
    )
}
