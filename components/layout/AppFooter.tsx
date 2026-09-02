import { UpcLogoIcon } from '@/components/UpcLogoIcon'
import { LayoutWidthContainer } from '@/components/layout/LayoutWidthContainer'

export function AppFooter() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="relative z-10 mt-auto border-t border-border bg-background">
            <LayoutWidthContainer className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 text-sm text-muted-foreground">
                <span>
                    © Universitat Politècnica de Catalunya
                    <span className="hidden sm:inline"> — BarcelonaTech, {currentYear}</span>
                </span>
                <div className="flex items-center gap-4">
                    <UpcLogoIcon className="size-6 text-foreground" aria-hidden />
                </div>
            </LayoutWidthContainer>
        </footer>
    )
}
