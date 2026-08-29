import type { JutgeApiClient, TradingCard } from '@/lib/jutge_api_client'

export type TradingCardRow = {
    card_id: string
    imageUrl: string
    created_at: string | number
}

export function tradingCardImageUrl(card_id: string, size: 'sm' | '' = ''): string {
    if (size === '') {
        return `https://jutge.org/img/trading-cards/${card_id}.webp`
    } else {
        return `https://jutge.org/img/trading-cards/${card_id}.${size}.webp`
    }
}

function buildTradingCardRow(card: TradingCard): TradingCardRow {
    return {
        card_id: card.card_id,
        imageUrl: tradingCardImageUrl(card.card_id),
        created_at: card.created_at as string | number,
    }
}

function sortTradingCards(cards: TradingCardRow[]): TradingCardRow[] {
    return [...cards].sort((a, b) => {
        const aTime = new Date(a.created_at).getTime()
        const bTime = new Date(b.created_at).getTime()
        if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
            return bTime - aTime
        }
        return a.card_id.localeCompare(b.card_id)
    })
}

export async function fetchTradingCards(client: JutgeApiClient): Promise<TradingCardRow[]> {
    const cards = await client.student.tradingCards.getAll()
    return sortTradingCards(cards.map(buildTradingCardRow))
}
