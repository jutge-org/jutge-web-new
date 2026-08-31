'use client'

import { ExternalLink } from '@/components/ExternalLink'
import { PageSpinner } from '@/components/ClientGates'
import { Prose } from '@/components/documentation/Prose'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownDocProps = {
    filename: string
}

export function MarkdownDoc({ filename }: MarkdownDocProps) {
    const [content, setContent] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function loadContent() {
            const response = await fetch(`/api/content/documentation/${filename}`)
            if (!response.ok || cancelled) {
                return
            }
            setContent(await response.text())
        }

        void loadContent()
        return () => {
            cancelled = true
        }
    }, [filename])

    if (!content) {
        return <PageSpinner />
    }

    return (
        <Prose>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children }) => {
                        if (href?.startsWith('/')) {
                            return (
                                <Link
                                    href={href}
                                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                                >
                                    {children}
                                </Link>
                            )
                        }
                        return <ExternalLink href={href ?? ''}>{children}</ExternalLink>
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </Prose>
    )
}
