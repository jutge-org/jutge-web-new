import type { TradingCardRow } from '@/lib/data/tradingCards'
import { includesForSearch } from '@/lib/utils'

export type TradingCardsSortField = 'date' | 'name' | 'family' | 'shuffle'
export type TradingCardsFamilyFilter = 'all' | (string & {})

export function tradingCardFamily(card_id: string): string {
    const slash = card_id.indexOf('/')
    if (slash <= 0) {
        return card_id
    }
    return card_id.slice(0, slash)
}

export function tradingCardName(card_id: string): string {
    const slash = card_id.indexOf('/')
    const rest = slash >= 0 ? card_id.slice(slash + 1) : card_id
    return rest.replace(/\.png$/i, '') || card_id
}

export function tradingCardDisplayName(card: Pick<TradingCardRow, 'card_id' | 'title'>): string {
    const trimmed = card.title.trim()
    if (trimmed) {
        return trimmed
    }
    return tradingCardName(card.card_id)
}

export function collectTradingCardFamilies(cards: Pick<TradingCardRow, 'card_id'>[]): string[] {
    const families = new Set<string>()
    for (const card of cards) {
        families.add(tradingCardFamily(card.card_id))
    }
    return [...families].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

function createdAtMs(created_at: string | number): number {
    const time = new Date(created_at).getTime()
    return Number.isFinite(time) ? time : 0
}

function matchesTradingCardSearch(card: TradingCardRow, query: string): boolean {
    if (!query) {
        return true
    }

    const family = tradingCardFamily(card.card_id)
    const name = tradingCardDisplayName(card)
    return includesForSearch([card.card_id, family, name].join(' '), query)
}

function matchesTradingCardFamilyFilter(card: TradingCardRow, filter: TradingCardsFamilyFilter): boolean {
    if (filter === 'all') {
        return true
    }
    return tradingCardFamily(card.card_id) === filter
}

function compareTradingCards(
    a: TradingCardRow,
    b: TradingCardRow,
    sortField: Exclude<TradingCardsSortField, 'shuffle'>,
): number {
    switch (sortField) {
        case 'name': {
            const byName = tradingCardDisplayName(a).localeCompare(tradingCardDisplayName(b), undefined, {
                sensitivity: 'base',
            })
            if (byName !== 0) return byName
            return a.card_id.localeCompare(b.card_id)
        }
        case 'family': {
            const byFamily = tradingCardFamily(a.card_id).localeCompare(tradingCardFamily(b.card_id), undefined, {
                sensitivity: 'base',
            })
            if (byFamily !== 0) return byFamily
            return tradingCardDisplayName(a).localeCompare(tradingCardDisplayName(b), undefined, {
                sensitivity: 'base',
            })
        }
        case 'date': {
            const byDate = createdAtMs(b.created_at) - createdAtMs(a.created_at)
            if (byDate !== 0) return byDate
            return a.card_id.localeCompare(b.card_id)
        }
    }
}

/** Deterministic Fisher–Yates shuffle so React memoization stays stable for a given seed. */
function shuffleWithSeed<T>(items: T[], seed: number): T[] {
    const result = [...items]
    let state = seed >>> 0 || 1
    for (let i = result.length - 1; i > 0; i--) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        const j = state % (i + 1)
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export function filterAndSortTradingCards(
    cards: TradingCardRow[],
    searchQuery: string,
    familyFilter: TradingCardsFamilyFilter,
    sortField: TradingCardsSortField,
    shuffleSeed = 0,
): TradingCardRow[] {
    const query = searchQuery.trim()
    const filtered = cards.filter(
        (card) => matchesTradingCardSearch(card, query) && matchesTradingCardFamilyFilter(card, familyFilter),
    )

    if (sortField === 'shuffle') {
        return shuffleWithSeed(filtered, shuffleSeed)
    }

    return filtered.sort((a, b) => compareTradingCards(a, b, sortField))
}
