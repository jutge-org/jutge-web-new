'use client'

import { AllCommunityModule, colorSchemeDark, colorSchemeLight, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useTheme } from 'next-themes'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

import { cn } from '@/lib/utils'

ModuleRegistry.registerModules([AllCommunityModule])

type GridProps = {
    wrapperBorder?: boolean
    themeParams?: Record<string, string>
    rowData?: any[]
    columnDefs?: any[]
    [key: string]: any
}

const myThemeLight = themeQuartz.withPart(colorSchemeLight).withParams({
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    accentColor: 'gray',
})

const myThemeDark = themeQuartz.withPart(colorSchemeDark).withParams({
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    accentColor: 'gray',
    backgroundColor: '#0b0a0b',
})

function useAgTheme(wrapperBorder = true, themeParams?: Record<string, string>) {
    const { resolvedTheme } = useTheme()
    const baseTheme = resolvedTheme === 'dark' ? myThemeDark : myThemeLight
    const params = {
        ...(wrapperBorder ? {} : { wrapperBorder: false }),
        ...themeParams,
    }
    return Object.keys(params).length > 0 ? baseTheme.withParams(params) : baseTheme
}

const AG_TABLE_CLASS = 'w-full [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-muted-foreground/50'

const AG_TABLE_FULL_MIN_HEIGHT_PX = 240

function useViewportTableHeight(containerRef: RefObject<HTMLDivElement | null>) {
    const [height, setHeight] = useState<number>()

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return

        function updateHeight() {
            const el = containerRef.current
            const footerEl = document.querySelector('footer')
            const mainEl = document.querySelector('main')
            if (!el) return

            const top = el.getBoundingClientRect().top
            const footerTop = footerEl?.getBoundingClientRect().top ?? window.innerHeight
            const mainPaddingBottom = mainEl ? parseFloat(getComputedStyle(mainEl).paddingBottom) || 0 : 0
            setHeight(Math.max(AG_TABLE_FULL_MIN_HEIGHT_PX, footerTop - top - mainPaddingBottom))
        }

        updateHeight()

        const observer = new ResizeObserver(updateHeight)
        const footer = document.querySelector('footer')
        if (footer) observer.observe(footer)
        const main = document.querySelector('main')
        if (main) observer.observe(main)

        window.addEventListener('resize', updateHeight)

        return () => {
            observer.disconnect()
            window.removeEventListener('resize', updateHeight)
        }
    }, [containerRef])

    return height
}

export function AgTableFull({ wrapperBorder = true, themeParams, ...props }: GridProps) {
    const theme = useAgTheme(wrapperBorder, themeParams)
    const containerRef = useRef<HTMLDivElement>(null)
    const height = useViewportTableHeight(containerRef)

    return (
        <div ref={containerRef} className={AG_TABLE_CLASS} style={height !== undefined ? { height } : undefined}>
            <AgGridReact
                {...props}
                theme={theme}
                animateRows={false}
                suppressColumnMoveAnimation={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
            />
        </div>
    )
}

export function AgTable({ wrapperBorder = true, themeParams, ...props }: GridProps) {
    const theme = useAgTheme(wrapperBorder, themeParams)

    return (
        <div className={`${AG_TABLE_CLASS} h-full`}>
            <AgGridReact
                {...props}
                theme={theme}
                animateRows={false}
                suppressColumnMoveAnimation={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
            />
        </div>
    )
}

export function AgTableAutoHeight({ wrapperBorder = true, themeParams, rowData, ...props }: GridProps) {
    const theme = useAgTheme(wrapperBorder, themeParams)

    // AG Grid's autoHeight layout floors the body at 150px so the "no rows" overlay has room to
    // render. With rows present that floor just pads short tables, so drop it.
    const hasRows = (rowData?.length ?? 0) > 0

    return (
        <div
            className={cn(
                AG_TABLE_CLASS,
                hasRows && '[&_.ag-center-cols-container]:min-h-0! [&_.ag-center-cols-viewport]:min-h-0!',
            )}
        >
            <AgGridReact
                {...props}
                rowData={rowData}
                theme={theme}
                domLayout="autoHeight"
                animateRows={false}
                suppressColumnMoveAnimation={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
            />
        </div>
    )
}
