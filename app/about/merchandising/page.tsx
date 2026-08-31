import { AboutPageShell } from '@/components/about/AboutPageShell'
import { MerchandisingBlock } from '@/components/home/MerchandisingBlock'

export default function AboutMerchandisingPage() {
    return (
        <AboutPageShell
            activeTab="merchandising"
            breadcrumbs={[
                { title: 'About', url: '/about' },
                { title: 'Merchandising', url: '/about/merchandising' },
            ]}
        >
            <div className="pt-6">
            <MerchandisingBlock embedded title={false}/>
            </div>
        </AboutPageShell>
    )
}
