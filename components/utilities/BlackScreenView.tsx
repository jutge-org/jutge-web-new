'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function BlackScreenView() {
    const router = useRouter()

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                router.push('/utilities')
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [router])

    return (
        <main id="main-content" className="fixed inset-0 bg-black" aria-label="Black screen">
            <h1 className="sr-only">Black screen</h1>
        </main>
    )
}
