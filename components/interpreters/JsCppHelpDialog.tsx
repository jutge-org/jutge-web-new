'use client'

import { HelpCircleIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { ExternalLink } from '@/components/ExternalLink'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const JSCPP_GITHUB_URL = 'https://github.com/felixhao28/JSCPP'

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

export function JsCppHelpDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon-sm" aria-label="About JSCPP">
                            <HelpCircleIcon aria-hidden />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">About JSCPP</TooltipContent>
            </Tooltip>
            <DialogContent className="flex max-h-[75vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-6 pt-6">
                    <DialogTitle>About JSCPP</DialogTitle>
                    <DialogDescription>Run and step through C++ in the browser.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <HelpSection title="What is JSCPP?">
                        <p>
                            JSCPP runs C++ programs in your browser. You can execute a program or step through it and
                            inspect local variables. The program stays in the browser.
                        </p>
                    </HelpSection>
                    <HelpSection title="What can you do here?">
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong className="font-medium text-foreground">Run</strong> the program. Text in
                                Standard input is read by <strong className="font-medium text-foreground">cin</strong>,
                                and printed text appears in Standard output.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Run with debug</strong> pauses on the
                                first statement. <strong className="font-medium text-foreground">Next</strong> advances
                                one statement and updates local variables.{' '}
                                <strong className="font-medium text-foreground">Stop</strong> leaves the debugger.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Clear</strong> the output,{' '}
                                <strong className="font-medium text-foreground">reset</strong> the editor and input,{' '}
                                <strong className="font-medium text-foreground">copy</strong> the program, or load a
                                sample.
                            </li>
                        </ul>
                    </HelpSection>
                </div>
                <DialogFooter className="mx-0 mb-0 shrink-0 flex-col gap-2 px-6 py-6 sm:flex-col">
                    <Button variant="outline" className="w-full" asChild>
                        <ExternalLink href={JSCPP_GITHUB_URL}>Open JSCPP on GitHub</ExternalLink>
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" className="w-full">
                            <XIcon className="size-4" />
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
