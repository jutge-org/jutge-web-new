'use client'

import { SendIcon } from 'lucide-react'
import { JSX, useState } from 'react'
import validator from 'validator'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export type EmailsDialogConfig = {
    title: string
    description: string
    buttonIcon: any
    buttonLabel: string
}

export type EmailsDialogResult = null | {
    validEmails: string[]
    wrongEmails: string[]
}

export const useEmailsDialog = (
    config: EmailsDialogConfig,
): [(defaultEmails: string[]) => Promise<EmailsDialogResult>, () => JSX.Element] => {
    //

    const [promise, setPromise] = useState<{
        resolve: (result: EmailsDialogResult) => void
    } | null>(null)
    const [open, setOpen] = useState(false)
    const [initialValue, setInitialValue] = useState<string[]>([])

    function runEmailsDialog(defaultEmails: string[]): Promise<EmailsDialogResult> {
        setInitialValue(defaultEmails)
        setOpen(true)
        return new Promise((resolve) => {
            setPromise({ resolve })
        })
    }

    function EmailsDialogComponent() {
        //

        const [value, setValue] = useState(initialValue.join('\n'))

        function close() {
            setPromise(null)
            setOpen(false)
            setValue('')
        }

        function acceptAction() {
            const lines = value
                .trim()
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
            const validEmails = Array.from(new Set(lines.filter((line) => validator.isEmail(line)))).sort()
            const wrongEmails = Array.from(new Set(lines.filter((line) => !validator.isEmail(line)))).sort()
            const result = {
                validEmails,
                wrongEmails,
            }

            promise?.resolve(result)
            close()
        }

        function cancelAction() {
            promise?.resolve(null)
            close()
        }

        return (
            <>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent onCloseAutoFocus={cancelAction}>
                        <DialogHeader>
                            <DialogTitle>{config.title}</DialogTitle>
                            <DialogDescription>{config.description}</DialogDescription>
                        </DialogHeader>
                        <Textarea
                            className="w-full h-48"
                            placeholder={`Enter each email on a line`}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        <SmoothButton color="blue" variant="candy" size="xs" onClick={acceptAction}>
                            {config.buttonIcon} {config.buttonLabel}
                        </SmoothButton>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    return [runEmailsDialog, EmailsDialogComponent]
}

export function EmailsDialogDemo() {
    //

    const [runEmailsDialog, EmailsDialogComponent] = useEmailsDialog({
        title: 'Title',
        description: 'Description',
        buttonIcon: <SendIcon />,
        buttonLabel: 'Label',
    })

    async function click() {
        const emails = ['joe@foo.bar.com', 'hanna@gmail.com']
        const answer = await runEmailsDialog(emails)
        console.log('Answer:', answer)
    }

    return (
        <>
            <SmoothButton color="blue" variant="candy" size="xs" onClick={() => click()}>Click me!</SmoothButton>
            <EmailsDialogComponent />
        </>
    )
}
