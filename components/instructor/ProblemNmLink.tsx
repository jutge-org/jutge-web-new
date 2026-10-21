import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import type { AbstractProblem } from '@/lib/jutge_api_client'
import { problemIconUrl } from '@/lib/problems'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type ProblemNmLinkProps = {
    problem_nm: string
    iconUrl?: string | null
    href?: string
    className?: string
    openInNewTab?: boolean
}

export function iconUrlFromAbstractProblems(
    problem_nm: string,
    abstractProblems: Record<string, AbstractProblem>,
): string | null {
    return problemIconUrl(abstractProblems[problem_nm]?.icon)
}

export function ProblemNmLink({
    problem_nm,
    iconUrl = null,
    href = `/problems/${problem_nm}`,
    className,
    openInNewTab = false,
}: ProblemNmLinkProps) {
    return (
        <Link
            href={href}
            className={cn(className)}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
            <span className="flex flex-row items-center gap-2">
                {iconUrl ? <ProblemIconImage iconUrl={iconUrl} size="xs" className="translate-y-px" /> : null}
                {problem_nm}
            </span>
        </Link>
    )
}
