'use client'

import { PageTitle } from '@/components/general/PageTitle'
import { InstructorIndex } from '@/components/instructor/InstructorIndex'

export default function InstructorPage() {
    return (
        <>
            <PageTitle section="/instructor" authenticated />
            <InstructorIndex />
        </>
    )
}
