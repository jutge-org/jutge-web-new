'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { useHljsThemePreference } from '@/hooks/use-hljs-theme-preference'
import { useHljsThemeStyles } from '@/hooks/use-hljs-theme-styles'
import { highlightYaml, objectToYaml } from '@/lib/highlightYaml'
import type { RunningExam } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

import '@/styles/submission-hljs.css'

export function LiveStudentExamYamlCard({ exam, className }: { exam: RunningExam; className?: string }) {
    const yaml = useMemo(() => objectToYaml(exam), [exam])
    const [highlightTheme] = useHljsThemePreference()
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useHljsThemeStyles(highlightTheme)

    const highlightedYaml = useMemo(() => highlightYaml(yaml), [yaml])
    const usesAutoTheme = highlightTheme === 'auto'
    const theme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

    return (
        <Card className={cn('w-full border border-border py-0 shadow-sm ring-0', className)}>
            <CardContent className="px-4 py-2">
                <div
                    className="submission-source-code overflow-hidden rounded-lg"
                    data-theme={usesAutoTheme ? theme : undefined}
                    data-hljs-theme={usesAutoTheme ? undefined : highlightTheme}
                    suppressHydrationWarning
                >
                    <pre
                        className="max-h-64 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre text-foreground"
                        aria-label="student.exam.get"
                    >
                        <code className="hljs language-yaml" dangerouslySetInnerHTML={{ __html: highlightedYaml }} />
                    </pre>
                </div>
            </CardContent>
        </Card>
    )
}