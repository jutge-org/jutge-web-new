'use client'

import { useMemo, useState } from 'react'
import { PaletteIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchInput } from '@/components/SearchInput'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_HLJS_THEME, formatHljsThemeLabel, HLJS_THEMES, type HljsThemeSelection } from '@/lib/hljsThemes'
import { includesForSearch } from '@/lib/utils'

type HljsHighlightThemeMenuProps = {
    highlightTheme: HljsThemeSelection
    setHighlightTheme: (theme: HljsThemeSelection) => void
    setPreviewTheme: (theme: HljsThemeSelection | null) => void
}

export function HljsHighlightThemeMenu({
    highlightTheme,
    setHighlightTheme,
    setPreviewTheme,
}: HljsHighlightThemeMenuProps) {
    const [themeSearch, setThemeSearch] = useState('')

    const filteredThemes = useMemo(() => {
        const query = themeSearch.trim()
        if (!query) {
            return HLJS_THEMES
        }

        return HLJS_THEMES.filter((theme) => {
            const label = formatHljsThemeLabel(theme)
            return includesForSearch(theme, query) || includesForSearch(label, query)
        })
    }, [themeSearch])

    function handleThemeMenuOpenChange(open: boolean) {
        if (!open) {
            setPreviewTheme(null)
            setThemeSearch('')
        }
    }

    function handleThemeSelect(value: HljsThemeSelection) {
        setHighlightTheme(value)
        setPreviewTheme(null)
    }

    return (
        <DropdownMenu onOpenChange={handleThemeMenuOpenChange}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label="Change syntax highlighting theme"
                        >
                            <PaletteIcon />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Change highlight theme</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-64 p-0">
                <div className="border-b border-border p-2">
                    <SearchInput
                        value={themeSearch}
                        onChange={(event) => setThemeSearch(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="Search themes…"
                        aria-label="Search highlight themes"
                    />
                </div>
                <ScrollArea className="h-72" onPointerLeave={() => setPreviewTheme(null)}>
                    <div className="p-1">
                        <DropdownMenuLabel>Theme</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={highlightTheme}
                            onValueChange={(value) => handleThemeSelect(value as HljsThemeSelection)}
                        >
                            <DropdownMenuRadioItem
                                value={DEFAULT_HLJS_THEME}
                                onPointerEnter={() => setPreviewTheme(DEFAULT_HLJS_THEME)}
                                onFocus={() => setPreviewTheme(DEFAULT_HLJS_THEME)}
                            >
                                Auto
                            </DropdownMenuRadioItem>
                            {filteredThemes.map((theme) => (
                                <DropdownMenuRadioItem
                                    key={theme}
                                    value={theme}
                                    onPointerEnter={() => setPreviewTheme(theme)}
                                    onFocus={() => setPreviewTheme(theme)}
                                >
                                    {formatHljsThemeLabel(theme)}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
