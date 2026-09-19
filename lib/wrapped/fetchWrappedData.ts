import type { JutgeApiClient, Submission } from '@/lib/jutge_api_client'
import { fetchStudentAvatarDataUrl } from '@/lib/data/users'
import { fetchFullAwards } from './awards'
import {
    emptyRangeMessage,
    invalidRangeMessage,
    liveLoadFailureMessage,
    mapApiError,
    translateApiError,
    type MappedApiError,
} from './errors'
import {
    aggregateDashboardFromSubmissions,
    isAllTimePeriod,
    isValidBoundedPeriod,
    submissionInPeriod,
    type WrappedPeriod,
} from './period'
import { fetchProblemTitles, uniqueProblemIds } from './problemTitles'
import { buildWrappedInsights } from './selectors'
import type { WrappedInsights, WrappedRawData } from './types'

export type WrappedLoadErrorKind = MappedApiError['kind'] | 'empty_range' | 'invalid_range'

export type WrappedLoadResult =
    | { status: 'ready'; raw: WrappedRawData; insights: WrappedInsights }
    | { status: 'error'; message: string; kind: WrappedLoadErrorKind }

/**
 * Load all raw wrapped data for a period and derive insights.
 * Uses the live Jutge API via the shared browser client.
 */
export async function fetchWrappedData(
    client: JutgeApiClient,
    period: WrappedPeriod,
): Promise<WrappedLoadResult> {
    if (!isAllTimePeriod(period) && !isValidBoundedPeriod(period)) {
        return {
            status: 'error',
            message: invalidRangeMessage(period),
            kind: 'invalid_range',
        }
    }

    try {
        const [
            profile,
            avatarUrl,
            tables,
            hexColors,
            homepageStats,
            level,
            absoluteRanking,
            briefAwards,
        ] = await Promise.all([
            client.student.profile.get(),
            fetchStudentAvatarDataUrl(client),
            client.tables.get(),
            client.misc.getHexColors(),
            client.misc.getHomepageStats(),
            client.student.dashboard.getLevel(),
            client.student.dashboard.getAbsoluteRanking(),
            client.student.awards.getAll(),
        ])

        const awards = await fetchFullAwards(client, briefAwards)

        let dashboard
        let periodSubmissions: Submission[] | undefined
        if (isAllTimePeriod(period)) {
            const [dashboardResult, allSubmissions] = await Promise.all([
                client.student.dashboard.getDashboard(),
                client.student.submissions.getAll(),
            ])
            dashboard = dashboardResult
            periodSubmissions = allSubmissions.length > 0 ? allSubmissions : undefined
        } else {
            const allSubmissions = await client.student.submissions.getAll()
            const filtered = allSubmissions.filter((s) => submissionInPeriod(s, period))
            if (filtered.length === 0) {
                return {
                    status: 'error',
                    message:
                        allSubmissions.length === 0
                            ? liveLoadFailureMessage(0)
                            : emptyRangeMessage(period),
                    kind: allSubmissions.length === 0 ? 'unknown' : 'empty_range',
                }
            }
            dashboard = aggregateDashboardFromSubmissions(filtered, tables)
            periodSubmissions = filtered
        }

        let problemTitles: Record<string, string> | undefined
        if (periodSubmissions?.length) {
            try {
                problemTitles = await fetchProblemTitles(client, uniqueProblemIds(periodSubmissions))
            } catch {
                problemTitles = undefined
            }
        }

        const raw: WrappedRawData = {
            profile,
            avatarUrl,
            dashboard,
            level,
            absoluteRanking,
            homepageStats,
            hexColors,
            tables,
            period,
            submissions: periodSubmissions,
            problemTitles,
            awards: awards && Object.keys(awards).length > 0 ? awards : undefined,
        }

        return {
            status: 'ready',
            raw,
            insights: buildWrappedInsights(raw),
        }
    } catch (error) {
        const mapped = mapApiError(error)
        return {
            status: 'error',
            message: translateApiError(mapped),
            kind: mapped.kind,
        }
    }
}
