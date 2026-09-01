'use client'

import { InfoIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function CompleteNameHelpDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0 -translate-y-1"
                                aria-label="How to write your complete name"
                            >
                                <InfoIcon className="size-3" aria-hidden />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">How to write your full name</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ful name</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <p>
                        Please write your full name as you would write it in your own language for an official document
                        and capitalize it correctly. For instance:
                    </p>
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>Donald E. Knuth</li>
                        <li>Miquel Martí i Pol</li>
                        <li>Miguel de Cervantes Saavedra</li>
                        <li>韩愈</li>
                    </ul>
                    <p>Accounts with invalid names will be deleted or not recognized by instructors.</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
