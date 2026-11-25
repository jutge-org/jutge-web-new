'use client'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import { ListItemsView } from '@/components/instructor/lists/ListItemsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorListSubNav } from '@/lib/instructor/menus'
import { useParams } from 'next/navigation'

export default function InstructorListItemsPage() {
    const { list_nm } = useParams<{ list_nm: string }>()
    const { profile } = useAuth()
    const baseHref = `/instructor/lists/${list_nm}`

    if (!profile) {
        return <PageSpinner />
    }

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Lists', url: '/instructor/lists' },
                { title: list_nm, url: `${baseHref}/items` },
            ]}
        >
            <InstructorSubNav items={instructorListSubNav(list_nm)} baseHref={baseHref} activeSegment="items" />
            <ListItemsView profile={profile} />
        </InstructorPageShell>
    )
}
