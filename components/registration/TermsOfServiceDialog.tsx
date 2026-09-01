'use client'

import { useState } from 'react'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function TermsOfServiceDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="text-primary underline-offset-4 underline"
                    onPointerDown={(event) => event.preventDefault()}
                >
                    Terms of Service
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Jutge.org&apos;s Terms of Service</DialogTitle>
                </DialogHeader>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Jutge.org, as a research and education project pursues the science of learning. Online learners are
                    important participants in that pursuit. The information we gather from your engagement with our
                    instructional offerings makes it possible for all stakeholders engaged in the Jutge.org to
                    continuously improve their work and, in that process, build learning science. For purposes of
                    research, we may share information we collect from online learning activities with researchers
                    beyond Jutge.org project, after anonymization. Similarly, any research findings might be reported at
                    the aggregate level and will not expose your personal identity. Your personally identifiable
                    information will only be shared with the instructors and tutors of the courses you decide to enroll.
                    We use cookies to improve your experience. By registering you accept such use.
                </p>
                <DialogFooter showCloseButton />
            </DialogContent>
        </Dialog>
    )
}
