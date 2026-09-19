import { UnauthorizedError } from '@/lib/jutge_api_client'
import { t } from './strings'
import {
    formatIsoDateForDisplay,
    formatPeriodLabel,
    type WrappedPeriod,
} from './period'

export type MappedApiError = {
    kind: 'unauthorized' | 'network' | 'protocol' | 'unknown'
    message: string
    raw?: unknown
}

export function wrappedRangeLabel(period: WrappedPeriod): string {
    if (period.start && period.end) {
        return t('period.through', {
            start: formatIsoDateForDisplay(period.start),
            end: formatIsoDateForDisplay(period.end),
        })
    }
    return formatPeriodLabel(period)
}

export function invalidRangeMessage(period: WrappedPeriod): string {
    return t('errors.invalidRange', {
        start: period.start ? formatIsoDateForDisplay(period.start) : '',
        end: period.end ? formatIsoDateForDisplay(period.end) : '',
    })
}

export function emptyRangeMessage(period: WrappedPeriod): string {
    return t('errors.emptyRange', { label: wrappedRangeLabel(period) })
}

export function liveLoadFailureMessage(allSubmissionsCount: number): string {
    if (allSubmissionsCount === 0) {
        return t('errors.loadFailureEmpty')
    }
    return t('errors.loadFailure')
}

export function translateApiError(error: MappedApiError): string {
    if (error.kind === 'network') return t('errors.network')
    if (error.kind === 'unknown' && error.message === 'An unexpected error occurred.') {
        return t('errors.unexpected')
    }
    return error.message
}

export function mapApiError(error: unknown): MappedApiError {
    if (error instanceof UnauthorizedError) {
        return { kind: 'unauthorized', message: error.message, raw: error }
    }
    if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
        return {
            kind: 'network',
            message:
                'Could not reach the Jutge API. This is often caused by browser CORS restrictions or network issues.',
            raw: error,
        }
    }
    if (error instanceof Error) {
        const isProtocol = error.name === 'ProtocolError' || /multipart|protocol/i.test(error.message)
        return {
            kind: isProtocol ? 'protocol' : 'unknown',
            message: error.message,
            raw: error,
        }
    }
    return {
        kind: 'unknown',
        message: 'An unexpected error occurred.',
        raw: error,
    }
}
