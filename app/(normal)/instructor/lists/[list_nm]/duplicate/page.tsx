'use client'

import { useParams } from 'next/navigation'
import { ListDuplicateView } from '@/components/instructor/lists/ListDuplicateView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorListSubNav } from '@/lib/instructor/menus'

export default function InstructorListDuplicatePage() {
    const { list_nm } = useParams<{ list_nm: string }>()
    const baseHref = `/instructor/lists/${list_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Lists', url: '/instructor/lists' },
                { title: list_nm, url: `${baseHref}/duplicate` },
            ]}
        >
            <InstructorSubNav items={instructorListSubNav(list_nm)} baseHref={baseHref} activeSegment="duplicate" />
            <ListDuplicateView />
        </InstructorPageShell>
    )
}
