import { cn } from '@/lib/utils'

export function EmailAddressText({ email, className }: { email: string; className?: string }) {
    const at = email.indexOf('@')
    if (at === -1) {
        return <span className={className}>{email}</span>
    }
    return (
        <span className={cn('min-w-0 break-all', className)}>
            {email.slice(0, at)}
            <span className="text-xs text-muted-foreground">{email.slice(at)}</span>
        </span>
    )
}