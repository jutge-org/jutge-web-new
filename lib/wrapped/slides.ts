import type { WrappedInsights } from './types'

export const SLIDE_IDS = [
    'intro',
    'heatmap_stats',
    'heatmap_calendar',
    'rhythm',
    'course',
    'verdict',
    'awards',
    'ranking',
    'performance',
    'recap',
] as const

export type SlideId = (typeof SLIDE_IDS)[number]

export function getActiveSlideIds(insights: WrappedInsights): SlideId[] {
    if (insights.awards.count === 0) {
        return SLIDE_IDS.filter((id) => id !== 'awards')
    }
    return [...SLIDE_IDS]
}

export const AWARDS_PER_PAGE = 6
