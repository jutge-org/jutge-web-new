import { ExternalLinkIcon } from 'lucide-react'
import { type ComponentProps } from 'react'

export function OpensInNewWindow() {
    return <span className="sr-only"> (opens in new window)</span>
}

type ExternalLinkProps = ComponentProps<'a'> & {
    href: string
    icon?: boolean
}

export function ExternalLink({ children, rel = 'noopener noreferrer', icon = true, ...props }: ExternalLinkProps) {
    return (
        <a target="_blank" rel={rel} {...props}>
            {icon ? <ExternalLinkIcon className="size-4" /> : null}
            {children}
            <OpensInNewWindow />
        </a>
    )
}
