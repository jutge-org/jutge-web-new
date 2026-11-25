'use client'

import { useEffect, useState } from 'react'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { TradingCardsList } from '@/components/tradingCards/TradingCardsList'
import { fetchTradingCards, type TradingCardRow } from '@/lib/data/tradingCards'
import jutge from '@/lib/jutge'

export default function CollectibleCardsPage() {
    return (
        <AuthedGate>
            <TradingCardsPageContent />
        </AuthedGate>
    )
}

function TradingCardsPageContent() {
    const [cards, setCards] = useState<TradingCardRow[] | null>(null)

    useEffect(() => {
        void fetchTradingCards(jutge).then(setCards)
    }, [])

    if (!cards) {
        return <PageSpinner />
    }

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Collectible cards', url: '/collectible-cards' }]} />
            <PageTitle section="/collectible-cards" authenticated hidden={false} />
            <TradingCardsList cards={cards} />
        </div>
    )
}
