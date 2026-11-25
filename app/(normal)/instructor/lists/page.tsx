'use client'

import { ListsListView } from '@/components/instructor/lists/ListsListView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorListsPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Lists', url: '/instructor/lists' },
            ]}
        >
            <ListsListView />
        </InstructorPageShell>
    )
}
