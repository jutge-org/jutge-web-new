import type { Ranking } from '@/lib/jutge_api_client'

export class PublicRankingUnavailable extends Error {
    constructor() {
        super('The public contest ranking is not available yet.')
        this.name = 'PublicRankingUnavailable'
    }
}

/**
 * Single fetch for the anonymous contest scoreboard.
 * The generated client has no unauthenticated ranking operation yet, so this
 * always fails and the page does not poll. When that operation exists, implement
 * it here. The watch page polls about every 10 seconds only after a successful fetch.
 */
export async function fetchPublicContestRanking(_examKey: string): Promise<Ranking> {
    throw new PublicRankingUnavailable()
}
