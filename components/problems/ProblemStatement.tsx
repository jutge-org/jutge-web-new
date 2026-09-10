'use client'

import { type CSSProperties } from 'react'
import { AArrowDownIcon, AArrowUpIcon, FileArchiveIcon, FileIcon, FileTextIcon, LigatureIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE, STATEMENT_FONT_SCALE_KEY } from '@/lib/fontScale'
import { downloadProblemPdf, downloadProblemTemplate, downloadProblemZip } from '@/lib/downloadProblemAssets'
import {
    STATEMENT_FONT_DEFAULT,
    STATEMENT_FONT_ET_BOOK,
    STATEMENT_FONT_SOURCE_SERIF_4,
    type StatementEtBookPreference,
} from '@/lib/statementEtBook'
import { cn } from '@/lib/utils'

type ProblemStatementProps = {
    pageKey: string
    problemId: string
    shortHtmlStatement: string
    templates: string[]
}

const downloadTileClassName =
    'w-28 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 transition-colors hover:bg-muted'

const downloadTileLabelClassName = 'max-w-32 truncate text-xs text-muted-foreground'

function getTemplateIconClassName(template: string) {
    return template.startsWith('main')
        ? 'size-4 shrink-0 text-sky-600 dark:text-sky-400'
        : 'size-4 shrink-0 text-green-600 dark:text-green-400'
}

export function ProblemStatementSkeleton() {
    return (
        <Card className="ring-0 border border-border shadow-sm" aria-busy="true" aria-label="Loading statement">
            <CardHeader className="border-b">
                <CardTitle>Statement</CardTitle>
                <CardAction>
                    <div className="flex items-center gap-2">
                        <Skeleton className="size-8 rounded-md" />
                        <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-28 rounded-md" />
                    <Skeleton className="h-7 w-28 rounded-md" />
                    <Skeleton className="h-7 w-28 rounded-md" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-1/2 rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="mt-4 h-8 w-24" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="mt-4 h-8 w-24" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-3/4" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-1/2 rounded-md" />
                </div>
            </CardContent>
        </Card>
    )
}

export function ProblemStatement({ problemId, shortHtmlStatement, templates }: ProblemStatementProps) {
    const [fontScale, setFontScale] = useFontScalePreference(STATEMENT_FONT_SCALE_KEY)
    const { statementEtBook, setStatementEtBook } = useAppearancePreferences()
    const statementFontAriaLabel =
        statementEtBook === STATEMENT_FONT_DEFAULT
            ? 'Statement font: Default'
            : statementEtBook === STATEMENT_FONT_SOURCE_SERIF_4
              ? 'Statement font: Source Serif 4'
              : 'Statement font: ET Book'

    async function handleDownload(fn: () => Promise<void>) {
        try {
            await fn()
        } catch {
            toast.error('Download failed.')
        }
    }

    // hack to get correct HTML statement for games, because they contain <html> and <body> tags
    shortHtmlStatement = shortHtmlStatement.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? shortHtmlStatement

    return (
        <TooltipProvider>
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle>Statement</CardTitle>
                    <CardAction>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                aria-label={statementFontAriaLabel}
                                                className={cn(statementEtBook === STATEMENT_FONT_DEFAULT && 'bg-muted')}
                                            >
                                                <LigatureIcon aria-hidden />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">{statementFontAriaLabel}</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Statement font</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={statementEtBook}
                                        onValueChange={(value) =>
                                            setStatementEtBook(value as StatementEtBookPreference)
                                        }
                                    >
                                        <DropdownMenuRadioItem value={STATEMENT_FONT_DEFAULT}>
                                            Default
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value={STATEMENT_FONT_SOURCE_SERIF_4}>
                                            Source Serif 4
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value={STATEMENT_FONT_ET_BOOK}>
                                            ET Book
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="inline-flex overflow-hidden rounded-lg border border-input">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label="Decrease statement font size"
                                            disabled={fontScale <= MIN_FONT_SCALE}
                                            onClick={() =>
                                                setFontScale((scale) =>
                                                    Math.max(MIN_FONT_SCALE, scale - FONT_SCALE_STEP),
                                                )
                                            }
                                            className="rounded-none border-0 border-r border-input"
                                        >
                                            <AArrowDownIcon aria-hidden />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Decrease font size</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label="Increase statement font size"
                                            disabled={fontScale >= MAX_FONT_SCALE}
                                            onClick={() =>
                                                setFontScale((scale) =>
                                                    Math.min(MAX_FONT_SCALE, scale + FONT_SCALE_STEP),
                                                )
                                            }
                                            className="rounded-none border-0"
                                        >
                                            <AArrowUpIcon aria-hidden />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Increase font size</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => handleDownload(() => downloadProblemPdf(problemId))}
                            aria-label="Download problem statement as PDF"
                            className={downloadTileClassName}
                        >
                            <FileTextIcon className="size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                            <span className={downloadTileLabelClassName}>pdf</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownload(() => downloadProblemZip(problemId))}
                            aria-label="Download problem files as ZIP"
                            className={downloadTileClassName}
                        >
                            <FileArchiveIcon
                                className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
                                aria-hidden
                            />
                            <span className={downloadTileLabelClassName}>zip</span>
                        </button>
                        {templates.map((template) => (
                            <button
                                key={template}
                                type="button"
                                onClick={() => handleDownload(() => downloadProblemTemplate(problemId, template))}
                                aria-label={`Download ${template}`}
                                className={downloadTileClassName}
                            >
                                <FileIcon className={getTemplateIconClassName(template)} aria-hidden />
                                <span className={downloadTileLabelClassName}>{template}</span>
                            </button>
                        ))}
                    </div>
                    <div
                        className={cn(
                            'statement-section text-foreground',
                            statementEtBook === STATEMENT_FONT_ET_BOOK && 'statement-section--et-book',
                            statementEtBook === STATEMENT_FONT_SOURCE_SERIF_4 && 'statement-section--source-serif-4',
                        )}
                        style={{ '--statement-scale': fontScale } as CSSProperties}
                        dangerouslySetInnerHTML={{ __html: shortHtmlStatement }}
                    />
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}
