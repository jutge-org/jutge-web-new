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

const PYODIDE_GITHUB_URL = 'https://github.com/pyodide/pyodide'

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

export function PyodideHelpDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-muted-foreground"
                            aria-label="About Pyodide"
                        >
                            <HelpCircleIcon aria-hidden />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>About Pyodide</TooltipContent>
            </Tooltip>
            <DialogContent className="flex max-h-[75vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-6 pt-6">
                    <DialogTitle>About Pyodide</DialogTitle>
                    <DialogDescription>Run Python in the browser.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <HelpSection title="What is Pyodide?">
                        <p>
                            Pyodide runs Python in your browser with WebAssembly. This page is a prompt: type a
                            statement, press Enter, and read the result. The session stays in the browser.
                        </p>
                    </HelpSection>
                    <HelpSection title="What can you do here?">
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong className="font-medium text-foreground">Enter</strong> runs the current line.{' '}
                                <strong className="font-medium text-foreground">Shift+Enter</strong> inserts a newline.
                                An unfinished block keeps the <strong className="font-medium text-foreground">...</strong>{' '}
                                prompt until the block is complete.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Tab</strong> completes the name at the
                                cursor. On an empty line, it inserts four spaces.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Up</strong> and{' '}
                                <strong className="font-medium text-foreground">Down</strong> recall earlier lines when
                                the cursor is at the start or end of the input.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Ctrl+C</strong> cancels the line you are
                                typing.
                            </li>
                            <li>Pasting several lines runs them in order.</li>
                            <li>
                                When the program calls <strong className="font-medium text-foreground">input()</strong>,
                                a dialog asks for the next line.
                            </li>
                            <li>
                                <strong className="font-medium text-foreground">Clear console</strong> wipes the
                                transcript and shows the banner again.
                            </li>
                        </ul>
                    </HelpSection>
                </div>
                <DialogFooter className="mx-0 mb-0 shrink-0 flex-col gap-2 px-6 py-6 sm:flex-col">
                    <Button variant="outline" className="w-full" asChild>
                        <ExternalLink href={PYODIDE_GITHUB_URL}>Open Pyodide on GitHub</ExternalLink>
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
