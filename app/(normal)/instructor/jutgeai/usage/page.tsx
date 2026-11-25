'use client'

import { JutgeAIUsageView } from '@/components/instructor/jutgeai/JutgeAIUsageView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorJutgeaiSubNav } from '@/lib/instructor/menus'

const baseHref = '/instructor/jutgeai'

export default function InstructorJutgeAIUsagePage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'JutgeAI', url: `${baseHref}/chat` },
            ]}
        >
            <InstructorSubNav items={instructorJutgeaiSubNav} baseHref={baseHref} activeSegment="usage" />
            <JutgeAIUsageView />
        </InstructorPageShell>
    )
}
