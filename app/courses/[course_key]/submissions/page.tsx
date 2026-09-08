'use client'

import { AuthedGate } from '@/components/ClientGates'
import { CourseManageShell } from '@/components/courses/CourseManageShell'
import { CourseSubmissionsView } from '@/components/courses/CourseSubmissionsView'

export default function CourseSubmissionsPage() {
    return (
        <AuthedGate>
            {(user) => (
                <CourseManageShell userId={user.id}>
                    {(course) => (
                        <CourseSubmissionsView courseKey={course.courseKey} />
                    )}
                </CourseManageShell>
            )}
        </AuthedGate>
    )
}
