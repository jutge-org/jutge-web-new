'use client'

import { AuthedGate } from '@/components/ClientGates'
import { CourseManageShell } from '@/components/courses/CourseManageShell'
import { CourseStudentsView } from '@/components/courses/CourseStudentsView'

export default function CourseStudentsPage() {
    return (
        <AuthedGate>
            {(user) => (
                <CourseManageShell userId={user.id}>
                    {(course) => (
                        <CourseStudentsView
                            courseKey={course.courseKey}
                            courseNm={course.course.course_nm}
                            isOwner={course.isOwner}
                        />
                    )}
                </CourseManageShell>
            )}
        </AuthedGate>
    )
}
