'use client'

import { JutgeAIChatView } from '@/components/instructor/jutgeai/JutgeAIChatView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorJutgeaiSubNav } from '@/lib/instructor/menus'

const baseHref = '/instructor/jutgeai'

export default function InstructorJutgeAIChatPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'JutgeAI', url: `${baseHref}/chat` },
            ]}
        >
            <InstructorSubNav items={instructorJutgeaiSubNav} baseHref={baseHref} activeSegment="chat" />
            <JutgeAIChatView />
        </InstructorPageShell>
    )
}
