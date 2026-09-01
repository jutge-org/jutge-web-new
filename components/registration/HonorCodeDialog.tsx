'use client'

import { useState } from 'react'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function HonorCodeDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="text-primary underline-offset-4 underline"
                    onPointerDown={(event) => event.preventDefault()}
                >
                    Honor Code
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Jutge.org&apos;s Honor Code</DialogTitle>
                </DialogHeader>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    By registering in Jutge.org, you agree to: rely solely on your own work in connection with all
                    assessments, problems, homework and assignments (unless collaboration is expressly permitted);
                    acknowledge any and all external sources used in your work; refrain from any activity that would
                    dishonestly or fraudulently improve your results or disadvantage others in the course; refrain from
                    disclosing answers to assessments, problems, assignments and homework to others; maintain only one
                    user account and not let anyone else use your username and/or password; and not access or attempt to
                    access any other user&apos;s account, or misrepresent or attempt to misrepresent your identity while
                    using the site;be held responsible for your postings, submissions and publications inside this site;
                    be polite with others who can read the information you submitted to this site. This Honor Code is
                    not intended to prohibit discussion of course material. While users must submit work that is their
                    own, you should feel free to discuss lectures or other course material with others either in-person
                    or online.
                </p>
                <DialogFooter showCloseButton />
            </DialogContent>
        </Dialog>
    )
}
