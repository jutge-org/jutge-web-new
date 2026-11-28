'use client'

import { CirclePlusIcon } from 'lucide-react'
import { JSX, useState } from 'react'
import { toast } from 'sonner'
import validator from 'validator'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type AddInstructorDialogResult = { email: string; username: string } | null

export const useAddInstructorDialog = (): [() => Promise<AddInstructorDialogResult>, () => JSX.Element] => {
    const [promise, setPromise] = useState<{ resolve: (result: AddInstructorDialogResult) => void } | null>(null)
    const [open, setOpen] = useState(false)

    function runAddInstructorDialog(): Promise<AddInstructorDialogResult> {
        setOpen(true)
        return new Promise((resolve) => {
            setPromise({ resolve })
        })
    }

    function AddInstructorDialogComponent() {
        const [email, setEmail] = useState('')
        const [username, setUsername] = useState('')

        function close() {
            setPromise(null)
            setOpen(false)
        }

        function acceptAction() {
            if (!validator.isEmail(email)) {
                toast.error('Invalid email.')
                return
            }
            if (username.length < 8) {
                toast.error('Username must be at least 8 characters long.')
                return
            }
            if (!validator.isAlphanumeric(username)) {
                toast.error('Username must be alphanumeric.')
                return
            }
            promise?.resolve({ email, username })
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
                        <DialogTitle>Add instructor</DialogTitle>
                        <DialogDescription>
                            This will give instructor privileges to a user identified by its email. To do so, you need
                            provide a username for him/her (e.g. JohnRuth).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-4">
                            <Label className="mt-2 w-28 text-right text-sm">Email</Label>
                            <Input
                                value={email}
                                placeholder="User's email"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-row gap-4">
                            <Label className="mt-2 w-28 text-right text-sm">Username</Label>
                            <Input
                                value={username}
                                placeholder="Instructor's username"
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <SmoothButton
                            type="button"
                            color="blue"
                            variant="candy"
                            size="xs"
                            className="mt-4"
                            onClick={acceptAction}
                        >
                            <CirclePlusIcon /> Add instructor
                        </SmoothButton>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return [runAddInstructorDialog, AddInstructorDialogComponent]
}
