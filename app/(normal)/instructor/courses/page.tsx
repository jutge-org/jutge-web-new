'use client'

import { CoursesListView } from '@/components/instructor/courses/CoursesListView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorCoursesPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Courses', url: '/instructor/courses' },
            ]}
        >
            <CoursesListView />
        </InstructorPageShell>
    )
}
