'use client'

import { useMemo, useState } from 'react'
import { LayersIcon, SearchIcon, XIcon } from 'lucide-react'

import { TradingCardsListToolbar } from '@/components/tradingCards/TradingCardsListToolbar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { TradingCardRow } from '@/lib/data/tradingCards'
import {
    collectTradingCardFamilies,
    filterAndSortTradingCards,
    tradingCardName,
    type TradingCardsFamilyFilter,
    type TradingCardsSortField,
} from '@/lib/tradingCards'
import { cn } from '@/lib/utils'

type TradingCardsListProps = {
    cards: TradingCardRow[]
}

export function TradingCardThumbnail({ src }: { src: string }) {
    const [isLandscape, setIsLandscape] = useState(false)

    return (
        <div className="relative aspect-[2/3] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt=""
                loading="lazy"
                onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget
                    setIsLandscape(naturalWidth > naturalHeight)
                }}
                className={cn(
                    'absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover',
                    isLandscape ? 'h-[66.666%] w-[150%] rotate-90' : 'h-full w-full',
                )}
            />
        </div>
    )
}

export function TradingCardDialog({
    card,
    open,
    onOpenChange,
}: {
    card: TradingCardRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full max-w-xl flex-col items-center gap-4 p-6">
                <DialogHeader className="w-full">
                    <DialogTitle>{card ? `Card ${tradingCardName(card.card_id)}` : 'Card'}</DialogTitle>
                </DialogHeader>
                {card && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <a href={card.imageUrl.replace('.sm', '')} target="_blank" rel="noopener noreferrer">
                            <img
                                src={card.imageUrl}
                                alt={`Card ${tradingCardName(card.card_id)}`}
                                className="max-h-[80vh] w-full max-w-sm rounded-2xl object-contain"
                            />
                        </a>
                        <div className="flex w-full flex-col gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => onOpenChange(false)}
                            >
                                <XIcon className="mr-2 h-4 w-4" aria-hidden />
                                Close
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

export function TradingCardsList({ cards }: TradingCardsListProps) {
    const [selected, setSelected] = useState<TradingCardRow | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [familyFilter, setFamilyFilter] = useState<TradingCardsFamilyFilter>('all')
    const [sortField, setSortField] = useState<TradingCardsSortField>('date')
    const [shuffleSeed, setShuffleSeed] = useState(0)

    const families = useMemo(() => collectTradingCardFamilies(cards), [cards])

    function handleSortFieldChange(value: TradingCardsSortField) {
        setSortField(value)
        if (value === 'shuffle') {
            setShuffleSeed((seed) => seed + 1)
        }
    }

    const visibleCards = useMemo(
        () => filterAndSortTradingCards(cards, searchQuery, familyFilter, sortField, shuffleSeed),
        [cards, familyFilter, searchQuery, shuffleSeed, sortField],
    )

    function openCard(card: TradingCardRow) {
        setSelected(card)
        setDialogOpen(true)
    }

    if (cards.length === 0) {
        return (
            <Empty className="rounded-2xl border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <LayersIcon aria-hidden />
                    </EmptyMedia>
                    <EmptyTitle>No collectible cards yet</EmptyTitle>
                    <EmptyDescription>
                        Solve problems and complete challenges on Jutge.org to earn collectible cards.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <TradingCardsListToolbar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                familyFilter={familyFilter}
                onFamilyFilterChange={setFamilyFilter}
                families={families}
                sortField={sortField}
                onSortFieldChange={handleSortFieldChange}
                visibleCount={visibleCards.length}
                totalCount={cards.length}
                showHelp
            />

            {visibleCards.length === 0 ? (
                <Empty className="border border-dashed border-border bg-muted/20 py-12">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <SearchIcon aria-hidden />
                        </EmptyMedia>
                        <EmptyTitle>No matching cards</EmptyTitle>
                        <EmptyDescription>
                            Try a different search term, adjust the family filter, or clear the search box.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {visibleCards.map((card) => {
                        const name = tradingCardName(card.card_id)
                        return (
                            <li key={card.card_id}>
                                <button
                                    type="button"
                                    onClick={() => openCard(card)}
                                    className="group w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                    aria-label={`View Card ${name}`}
                                >
                                    <TradingCardThumbnail src={card.imageUrl} />
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}

            <TradingCardDialog card={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    )
}
