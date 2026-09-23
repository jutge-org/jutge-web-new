'use client'

import { HelpCircleIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type HelpSectionProps = {
    title: string
    children: React.ReactNode
}

function HelpSection({ title, children }: HelpSectionProps) {
    return (
        <section className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </section>
    )
}

export function ProblemPasscodesHelpDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" aria-label="About passcodes">
                            <HelpCircleIcon aria-hidden />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">About passcodes</TooltipContent>
            </Tooltip>
            <DialogContent className="flex max-h-[75vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-6 pt-6">
                    <DialogTitle>About passcodes</DialogTitle>
                    <DialogDescription>
                        Learn how problem passcodes work and how to store them for your account.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 overflow-y-auto px-6 py-6">
                    <HelpSection title="What are problem passcodes?">
                        <p>
                            Some problems are protected by a passcode. Without one, the problem is visible to everyone.
                            With one, it is visible only to users who have the correct passcode stored on their
                            account.
                        </p>
                    </HelpSection>

                    <HelpSection title="What can you do here?">
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong className="font-medium text-foreground">Add</strong> a passcode with the
                                problem id you were given, such as{' '}
                                <strong className="font-medium text-foreground">P12345</strong>. The passcode is checked
                                against the problem and stored only if it matches.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Show</strong> a stored passcode with the
                                eye button on its row. Passcodes stay hidden until you do.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Remove</strong> a stored passcode. You
                                can add it again later if you still have it.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Search</strong> by problem id, title, or author.
                            </li>
                        </ul>
                    </HelpSection>
                </div>
            </DialogContent>
        </Dialog>
    )
}
