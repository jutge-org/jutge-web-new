'use client'

import { ListsNewView } from '@/components/instructor/lists/ListsNewView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorListsNewPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Lists', url: '/instructor/lists' },
                { title: 'Add list', url: '/instructor/lists/new' },
            ]}
        >
            <ListsNewView />
        </InstructorPageShell>
    )
}
