'use client'

import { JSX, useState } from 'react'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export type TextareaDialogConfig = {
    title: string
    description: string
    buttonIcon: React.ReactNode
    buttonLabel: string
}

export type TextareaDialogResult = string | null

export const useTextareaDialog = (
    config: TextareaDialogConfig,
): [(defaultValue: string) => Promise<TextareaDialogResult>, () => JSX.Element] => {
    const [promise, setPromise] = useState<{
        resolve: (result: TextareaDialogResult) => void
    } | null>(null)
    const [open, setOpen] = useState(false)
    const [initialValue, setInitialValue] = useState('')

    function runTextareaDialog(defaultValue: string): Promise<TextareaDialogResult> {
        setInitialValue(defaultValue)
        setOpen(true)
        return new Promise((resolve) => {
            setPromise({ resolve })
        })
    }

    function TextareaDialogComponent() {
        const [value, setValue] = useState(initialValue)

        function close() {
            setPromise(null)
            setOpen(false)
        }

        function acceptAction() {
            promise?.resolve(value)
            close()
        }

        function cancelAction() {
            promise?.resolve(null)
            close()
        }

        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent onCloseAutoFocus={cancelAction}>
                    <DialogHeader>
                        <DialogTitle>{config.title}</DialogTitle>
                        <DialogDescription>{config.description}</DialogDescription>
                    </DialogHeader>
                    <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="h-32" />
                    <SmoothButton color="blue" variant="candy" size="xs" onClick={acceptAction}>
                        {config.buttonIcon} {config.buttonLabel}
                    </SmoothButton>
                </DialogContent>
            </Dialog>
        )
    }

    return [runTextareaDialog, TextareaDialogComponent]
}
