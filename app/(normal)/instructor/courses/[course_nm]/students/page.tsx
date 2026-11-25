'use client'

import { useParams } from 'next/navigation'
import { CourseStudentsView } from '@/components/instructor/courses/CourseStudentsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorCourseSubNav } from '@/lib/instructor/menus'

export default function InstructorCourseStudentsPage() {
    const { course_nm } = useParams<{ course_nm: string }>()
    const baseHref = `/instructor/courses/${course_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Courses', url: '/instructor/courses' },
                { title: course_nm, url: `${baseHref}/students` },
            ]}
        >
            <InstructorSubNav items={instructorCourseSubNav(course_nm)} baseHref={baseHref} activeSegment="students" />
            <CourseStudentsView />
        </InstructorPageShell>
    )
}
