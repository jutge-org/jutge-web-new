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

const SKULPT_GITHUB_URL = 'https://github.com/skulpt/skulpt'

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

export function PyWebHelpDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon-sm" aria-label="About PyWeb">
                            <HelpCircleIcon aria-hidden />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">About PyWeb</TooltipContent>
            </Tooltip>
            <DialogContent className="flex max-h-[75vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-6 pt-6">
                    <DialogTitle>About PyWeb</DialogTitle>
                    <DialogDescription>Run Python in the browser with turtle graphics.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <HelpSection title="What is PyWeb?">
                        <p>
                            PyWeb runs Python programs in your browser with Skulpt. You can print to the console, read
                            input, and draw with the turtle module. The program stays in the browser.
                        </p>
                    </HelpSection>
                    <HelpSection title="What can you do here?">
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong className="font-medium text-foreground">Run</strong> the program in the editor.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Clear</strong> the console and the
                                turtle canvas.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Reset</strong> the editor to the
                                original program.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Copy</strong> the program, or load a
                                sample from the sample programs menu.
                            </li>
                            <li>
                                When the program calls <strong className="font-medium text-foreground">input()</strong>,
                                a dialog asks for the next line.
                            </li>
                        </ul>
                    </HelpSection>
                </div>
                <DialogFooter className="mx-0 mb-0 shrink-0 flex-col gap-2 px-6 py-6 sm:flex-col">
                    <Button variant="outline" className="w-full" asChild>
                        <ExternalLink href={SKULPT_GITHUB_URL}>Open Skulpt on GitHub</ExternalLink>
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
