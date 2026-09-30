'use client'

import { Spinner } from '@/components/ui/spinner'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'

const Sandpack = dynamic(async () => (await import('@codesandbox/sandpack-react')).Sandpack, {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <Spinner className="size-6" />
        </div>
    ),
})

export function SandPackView() {
    const { resolvedTheme } = useTheme()
    const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

    return (
        <div
            className="h-[calc(100dvh-13rem)] min-h-96 w-full overflow-hidden rounded-xl border border-border [&_.sp-layout]:h-full [&_.sp-wrapper]:h-full"
            role="region"
            aria-label="SandPack"
        >
            <Sandpack
                template="vanilla"
                theme={theme}
                options={{
                    showConsole: true,
                    editorHeight: '100%',
                }}
            />
        </div>
    )
}
