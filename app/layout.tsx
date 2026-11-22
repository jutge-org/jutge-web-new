import { AppShell } from '@/components/AppShell'
import { AppToaster } from '@/components/AppToaster'
import { AppearancePreferencesProvider } from '@/components/AppearancePreferencesProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { LayoutWidthProvider } from '@/components/layout/LayoutWidthProvider'
import { SettingsProvider } from '@/components/SettingsProvider'
import { SiteModeProvider } from '@/components/SiteModeProvider'
import { SkipLink } from '@/components/SkipLink'
import { ThemeProvider } from '@/components/ThemeProvider'
import { resolveSiteModeFromRequest, siteBrand } from '@/lib/siteMode'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
    const headerList = await headers()
    const site = resolveSiteModeFromRequest(headerList.get('host'), headerList.get('x-forwarded-host'))
    const brand = siteBrand(site.kind)
    return {
        title: {
            default: brand,
            template: `%s — ${brand}`,
        },
        description: 'The Open client for Jutge.org',
        icons: {
            icon: '/favicon.ico',
        },
    }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const headerList = await headers()
    const site = resolveSiteModeFromRequest(headerList.get('host'), headerList.get('x-forwarded-host'))

    return (
        <html lang="en" className="bg-background" suppressHydrationWarning>
            <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
                <SkipLink />
                <ThemeProvider>
                    <SiteModeProvider value={site}>
                        <AuthProvider>
                            <SettingsProvider>
                                <LayoutWidthProvider>
                                    <AppearancePreferencesProvider>
                                        <AppShell>{children}</AppShell>
                                        <AppToaster />
                                    </AppearancePreferencesProvider>
                                </LayoutWidthProvider>
                            </SettingsProvider>
                        </AuthProvider>
                    </SiteModeProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
