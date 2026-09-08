'use client'

import { ClipboardIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const SAMPLE_PROMPT = `A high resolution very detailed collectible trading card with the given character in a Hawaian beach. He is standing on the beach, taking a selfie of himself with a simple phone with one hand and making a thumbs up sign with other hand.
The image and composition must follow award winning National Geographic style. Use realistic stunning colors, and a cinematic action and great lightning details.
Do not add icons, do not add stat box, do not add ability text area.
Add a "Jutge.org" title integrated into the left bottom frame using some hawaian looking font.
Use a frame with hawaian native motives.
Use black background.
--ar 2:3`

export function TradingCardsSubmitDialog() {
    const [open, setOpen] = useState(false)

    function copyPrompt() {
        void navigator.clipboard.writeText(SAMPLE_PROMPT).then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Could not copy to clipboard'),
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" aria-label="Submit a new card">
                            <PlusIcon aria-hidden />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Submit a new card</TooltipContent>
            </Tooltip>
            <DialogContent className="flex max-h-[75vh] w-full w-3xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-6 pt-6">
                    <DialogTitle>Submit a new card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 overflow-y-auto px-6 py-6 text-sm leading-relaxed text-muted-foreground">
                    <p>
                        If you want to submit a new collectible card, please send it to the administrators of Jutge.org.
                        The administrators will review the card and add it to the database if it is valid.
                    </p>
                    <p>
                        Cards must be generated with Gemini with 2:3 aspect ratio and feature the Jutge.org text, a
                        frame and a black background.
                    </p>
                    <div className="flex items-center justify-between gap-2">
                        <p>Here is a sample prompt to get you started:</p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-3 shrink-0"
                                    aria-label="Copy prompt to clipboard"
                                    onClick={copyPrompt}
                                >
                                    <ClipboardIcon aria-hidden />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Copy to clipboard</TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="italic whitespace-pre-wrap text-xs">{SAMPLE_PROMPT}</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
