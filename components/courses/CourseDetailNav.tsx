'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { SubNav } from '@/components/general/SubNav'
import { canSuperviseCourse } from '@/lib/courses'
import { courseDetailNavItems, courseDetailTabFromPathname } from '@/lib/courseDetailNav'
import type { SubNavItem } from '@/store/SubNav'

type CourseDetailNavProps = {
    courseKey: string
    isOwner: boolean
    isTutor: boolean
}

/** Sticky secondary nav for course owners and tutors. */
export function CourseDetailNav({ courseKey, isOwner, isTutor }: CourseDetailNavProps) {
    const pathname = usePathname()
    const activeTab = courseDetailTabFromPathname(pathname, courseKey)
    const showSecondaryNav = canSuperviseCourse({ isOwner, isTutor })

    const items = useMemo((): readonly SubNavItem[] => {
        return courseDetailNavItems(courseKey).map(({ tab, label, href }) => ({
            key: tab,
            label,
            href,
        }))
    }, [courseKey])

    if (!showSecondaryNav) {
        return null
    }

    return <SubNav ariaLabel="Course management sections" activeKey={activeTab} items={items} />
}
