'use client'

import { ArrowRightIcon, LayersIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { TradingCardDialog, TradingCardThumbnail } from '@/components/tradingCards/TradingCardsList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { fetchTradingCards, type TradingCardRow } from '@/lib/data/tradingCards'
import jutge from '@/lib/jutge'

export function HomeRecentCollectibleCards() {
    const [cards, setCards] = useState<TradingCardRow[] | null>(null)
    const [failed, setFailed] = useState(false)
    const [selectedCard, setSelectedCard] = useState<TradingCardRow | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        let active = true
        void fetchTradingCards(jutge)
            .then((data) => {
                if (active) setCards(data)
            })
            .catch(() => {
                if (active) setFailed(true)
            })
        return () => {
            active = false
        }
    }, [])

    if (failed) {
        return null
    }

    const recentCards = cards ? cards.slice(0, 10) : null

    function handleCardClick(card: TradingCardRow) {
        setSelectedCard(card)
        setDialogOpen(true)
    }

    return (
        <>
            <Card className="rounded-2xl border border-border border-t-2 border-t-rose-500 shadow-sm">
                <CardHeader className="p-0">
                    <Link
                        href="/collectible-cards"
                        className="group flex min-h-11 items-center justify-between gap-2 px-4 py-2 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                        <CardTitle className="gap-2 text-base font-semibold">
                            <LayersIcon className="size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
                            Latest collected cards
                        </CardTitle>
                        <ArrowRightIcon
                            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                            aria-hidden
                        />
                    </Link>
                </CardHeader>
                <CardContent className="border-t border-border/60 p-4">
                    {recentCards === null ? (
                        <div
                            aria-busy="true"
                            aria-label="Loading collectible cards"
                            className="flex h-32 items-center justify-center"
                        >
                            <Spinner className="size-6 text-muted-foreground" />
                        </div>
                    ) : recentCards.length === 0 ? (
                        <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                            No collectible cards yet.
                        </div>
                    ) : (
                        <TooltipProvider>
                            <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-thin">
                                {recentCards.map((card) => {
                                    const cardName = card.card_id.split('/')[1]
                                    return (
                                        <Tooltip key={card.card_id}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCardClick(card)}
                                                    className="group relative w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-20"
                                                    aria-label={`View Card ${cardName}`}
                                                >
                                                    <TradingCardThumbnail src={card.imageUrl} />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Card {cardName}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </TooltipProvider>
                    )}
                </CardContent>
            </Card>

            <TradingCardDialog card={selectedCard} open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
    )
}
