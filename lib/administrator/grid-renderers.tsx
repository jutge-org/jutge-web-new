import { EmailAddressText } from '@/components/general/EmailAddressText'

export function emailRenderer(field: string) {
    return function EmailComponent(p: { data: Record<string, string> }) {
        return <EmailAddressText email={p.data[field]} />
    }
}
