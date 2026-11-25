'use client'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import { CourseListsView } from '@/components/instructor/courses/CourseListsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorCourseSubNav } from '@/lib/instructor/menus'
import { useParams } from 'next/navigation'

export default function InstructorCourseListsPage() {
    const { course_nm } = useParams<{ course_nm: string }>()
    const { profile } = useAuth()
    const baseHref = `/instructor/courses/${course_nm}`

    if (!profile) {
        return <PageSpinner />
    }

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Courses', url: '/instructor/courses' },
                { title: course_nm, url: `${baseHref}/lists` },
            ]}
        >
            <InstructorSubNav items={instructorCourseSubNav(course_nm)} baseHref={baseHref} activeSegment="lists" />
            <CourseListsView profile={profile} />
        </InstructorPageShell>
    )
}
