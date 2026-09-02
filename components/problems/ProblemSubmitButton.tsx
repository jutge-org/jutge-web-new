'use client'

import { useState } from 'react'
import { SendHorizonalIcon } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { SubmissionDialog } from '@/components/problems/SubmissionDialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Compiler } from '@/lib/jutge_api_client'
import { Button } from '../ui/button'

type ProblemSubmitButtonProps = {
    problemId: string
    compilers: Compiler[]
    defaultCompilerId?: string | null
}

export function ProblemSubmitButton({ problemId, compilers, defaultCompilerId }: ProblemSubmitButtonProps) {
    const { user, loading } = useAuth()
    const [dialogOpen, setDialogOpen] = useState(false)

    if (loading || !user) {
        return null
    }

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="default"
                        size="icon-lg"
                        className="size-16 shrink-0 rounded-full hover:bg-primary/80"
                        aria-label="New submission"
                        onClick={() => setDialogOpen(true)}
                    >
                        <SendHorizonalIcon
                            className="size-8 shrink-0 translate-x-0.5 stroke-[1.5] transition-transform duration-200 ease-out group-hover:translate-x-1"
                            aria-hidden
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">New submission</TooltipContent>
            </Tooltip>
            <SubmissionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                problemId={problemId}
                compilers={compilers}
                defaultCompilerId={defaultCompilerId}
            />
        </>
    )
}
