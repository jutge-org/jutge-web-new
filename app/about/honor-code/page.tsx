import { AboutHonorCode } from '@/components/about/AboutHonorCode'
import { AboutPageShell } from '@/components/about/AboutPageShell'

export default function AboutHonorCodePage() {
    return (
        <AboutPageShell
            activeTab="honor-code"
            breadcrumbs={[
                { title: 'About', url: '/about' },
                { title: 'Honor Code', url: '/about/honor-code' },
            ]}
        >
            <AboutHonorCode />
        </AboutPageShell>
    )
}
