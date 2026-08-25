'use client'

import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'

export default function RequestInstructorAccountPage() {
    return (
        <div className="flex flex-col gap-6 pb-8">
            <MainBreadcrumbs
                breadcrumbs={[{ title: 'Request instructor account', url: '/request-instructor-account' }]}
            />
            <div className="mx-auto w-full max-w-2xl">
                <h1 className="font-bold text-2xl tracking-tight md:text-3xl">Request an instructor account</h1>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                    This page is under construction. Instructor account requests will be available here soon. In the
                    meantime, please contact the Jutge.org team if you need instructor privileges.
                </p>
            </div>
        </div>
    )
}
