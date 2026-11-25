'use client'

import { useParams } from 'next/navigation'
import { CoursePropertiesView } from '@/components/instructor/courses/CoursePropertiesView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorCourseSubNav } from '@/lib/instructor/menus'

export default function InstructorCoursePropertiesPage() {
    const { course_nm } = useParams<{ course_nm: string }>()
    const baseHref = `/instructor/courses/${course_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Courses', url: '/instructor/courses' },
                { title: course_nm, url: `${baseHref}/properties` },
            ]}
        >
            <InstructorSubNav
                items={instructorCourseSubNav(course_nm)}
                baseHref={baseHref}
                activeSegment="properties"
            />
            <CoursePropertiesView />
        </InstructorPageShell>
    )
}
