import { AboutPageShell } from '@/components/about/AboutPageShell'
import { AboutTermsOfService } from '@/components/about/AboutTermsOfService'

export default function AboutTermsOfServicePage() {
    return (
        <AboutPageShell
            activeTab="terms-of-service"
            breadcrumbs={[
                { title: 'About', url: '/about' },
                { title: 'Terms of Service', url: '/about/terms-of-service' },
            ]}
        >
            <AboutTermsOfService />
        </AboutPageShell>
    )
}
