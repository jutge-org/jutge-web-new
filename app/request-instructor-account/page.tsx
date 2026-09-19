'use client'

import { LightbulbIcon, MailIcon, SquareExclamationPointIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import SmoothButton from '@/components/ui/smoothui/smooth-button'

function InlineCode({ children }: { children: ReactNode }) {
    return (
        <code className="rounded-md bg-muted px-1.5 py-0.5 text-[0.9em] text-foreground">{children}</code>
    )
}

export default function RequestInstructorAccountPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 pb-8">
            <MainBreadcrumbs
                breadcrumbs={[
                    { title: 'Request instructor account', url: '/request-instructor-account' },
                ]}
            />
            <PageTitle section="/request-instructor-account" authenticated={false} hidden={false} />

            <Card className="w-full">
                <CardContent className="mx-auto w-full max-w-2xl space-y-5 leading-relaxed text-foreground flex flex-col gap-0">
                    <p className="text-justify">
                        To upgrade your existing Jutge.org account with instructor rights, please send an email to{' '}
                        <span className="muted-foreground">contact@jutge.org</span>. Include your full name, the email of the account you want upgraded, and
                        proof that you teach at an educational institution
                        (e.g., attach a scan of your instructor card).
                    </p>

                    <Alert className='border-none'>
                        <SquareExclamationPointIcon aria-hidden />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                            <ul className="mt-1 list-disc space-y-2 pl-4">
                                <li className="text-justify">
                                    Instructor rights are only required to <em>create</em> courses.
                                    To become a tutor in an existing course, ask that course&apos;s
                                    instructor to invite you — no upgrade is needed.
                                </li>
                                <li className="text-justify">
                                    Prefer a dedicated teaching account over your personal one.
                                    That makes it easier to hand the course over to someone else
                                    later.
                                </li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <Alert className='border-none'>
                        <LightbulbIcon aria-hidden />
                        <AlertTitle>Tip</AlertTitle>
                        <AlertDescription>
                            <ul className="mt-1 list-disc space-y-2 pl-4">
                                <li className="text-justify">
                                    Plus-addressing is a convenient way to create extra accounts. Most
                                    mail systems (including Gmail) deliver mail to{' '}
                                    user+tag@example.com as if it were sent to{' '}
                                    user@example.com, while sites as Jutge.org treats
                                    them as separate addresses. You can use the{' '}
                                    tag portion to organize different courses you may be teaching.
                                    This strategy also makes easier transitions of accounts when
                                    the instructor changes.
                                </li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <p className="text-justify">
                        Please allow some time for your request to be reviewed.
                    </p>

                    <SmoothButton asChild color="accent" variant="candy" className="w-full flex flex-row gap-2 mt-2 mb-6">
                        <Link
                            href={
                                'mailto:contact@jutge.org' +
                                '?subject=' +
                                encodeURIComponent('Request instructor account for Jutge.org') +
                                '&body=' +
                                encodeURIComponent(
                                    [
                                        'Hello,',
                                        '',
                                        'I would like to request instructor rights for my Jutge.org account.',
                                        '',
                                        'Full name: ',
                                        'Account email: ',
                                        'Institution: ',
                                        '',
                                        'I have attached proof that I teach at an educational institution.',
                                        '',
                                        'I understand that this request may take some time to be reviewed.',
                                        '',
                                        'Thank you.',
                                    ].join('\n'),
                                )
                            }
                        >
                            <MailIcon className="size-4" aria-hidden />
                            Send email to request instructor account
                        </Link>
                    </SmoothButton>

                </CardContent>
            </Card>
        </div>
    )
}
