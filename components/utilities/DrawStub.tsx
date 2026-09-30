import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PenLineIcon } from 'lucide-react'

export function DrawStub() {
    return (
        <Empty className="rounded-2xl border border-dashed">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <PenLineIcon aria-hidden />
                </EmptyMedia>
                <EmptyTitle>Draw</EmptyTitle>
                <EmptyDescription>This tool is not available yet.</EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}
