import SmoothButton from '@/components/smoothui/smooth-button'
import { HomeIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function NotFoundView() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center sm:py-16">
            <Image
                alt=""
                className="h-auto w-72 max-w-full sm:w-96"
                height={384}
                priority
                src="/jutge/404.png"
                width={384}
            />
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
                <p className="text-muted-foreground">
                    The page you requested does not exist or you may not have access to it.
                </p>
            </div>
            <nav aria-label="Helpful links">
                <SmoothButton asChild className="w-56 mt-4" color="blue" variant="candy">
                    <Link href="/">
                        <HomeIcon aria-hidden />
                        Home
                    </Link>
                </SmoothButton>
            </nav>
        </div>
    )
}