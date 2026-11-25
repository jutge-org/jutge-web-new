'use client'

import { SearchView } from '@/components/instructor/search/SearchView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorSearchPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Search', url: '/instructor/search' },
            ]}
        >
            <SearchView />
        </InstructorPageShell>
    )
}
