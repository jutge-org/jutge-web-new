'use client'

import { CoursesNewView } from '@/components/instructor/courses/CoursesNewView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorCoursesNewPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Courses', url: '/instructor/courses' },
                { title: 'Add course', url: '/instructor/courses/new' },
            ]}
        >
            <CoursesNewView />
        </InstructorPageShell>
    )
}
