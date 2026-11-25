'use client'

import { usePathname } from 'next/navigation'

import { toPublicPathname } from '@/lib/siteMode'

/** `usePathname()` with the internal exam-site prefix removed. */
export function usePublicPathname(): string {
    return toPublicPathname(usePathname() ?? '/')
}
