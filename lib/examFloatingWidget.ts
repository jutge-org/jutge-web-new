export const EXAM_FLOATING_WIDGET_CLOSE_CHANNEL = 'jutge-exam-floating-widget-close'
export const EXAM_FLOATING_WIDGET_NAV_CHANNEL = 'jutge-exam-floating-widget-nav'

export type ExamFloatingWidgetTabId = 'info' | 'clock' | 'timer' | 'problems' | 'documents' | 'submissions'

const EXAM_FLOATING_WIDGET_TAB_IDS: ExamFloatingWidgetTabId[] = [
    'info',
    'clock',
    'timer',
    'problems',
    'documents',
    'submissions',
]

export const EXAM_FLOATING_WIDGET_TAB_STORAGE_KEY = 'jutge:exam-floating-widget-tab'

export function parseExamFloatingWidgetTab(value: string | null | undefined): ExamFloatingWidgetTabId | null {
    if (!value) return null
    return EXAM_FLOATING_WIDGET_TAB_IDS.includes(value as ExamFloatingWidgetTabId)
        ? (value as ExamFloatingWidgetTabId)
        : null
}

export function readExamFloatingWidgetTab(): ExamFloatingWidgetTabId {
    if (typeof window === 'undefined') return 'timer'
    return parseExamFloatingWidgetTab(localStorage.getItem(EXAM_FLOATING_WIDGET_TAB_STORAGE_KEY)) ?? 'timer'
}

export function writeExamFloatingWidgetTab(tab: ExamFloatingWidgetTabId): void {
    try {
        localStorage.setItem(EXAM_FLOATING_WIDGET_TAB_STORAGE_KEY, tab)
    } catch {
        // ignore quota / private mode
    }
}

export type ExamFloatingWidgetNavMessage = {
    type: 'navigate'
    path: string
}

const EXAM_WIDGET_EXACT_PATHS = new Set(['/problems', '/submissions'])

export function isExamFloatingWidgetNavPath(path: string): boolean {
    if (EXAM_WIDGET_EXACT_PATHS.has(path)) return true
    return path.startsWith('/problems/') && !path.includes('//')
}

export function notifyExamFloatingWidgetClose(): void {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(EXAM_FLOATING_WIDGET_CLOSE_CHANNEL)
    channel.postMessage('close')
    channel.close()
}

/** Open a route in the main browser window without navigating the widget surface. */
export function requestExamFloatingWidgetNavigation(path: string): void {
    if (!isExamFloatingWidgetNavPath(path)) return

    const message: ExamFloatingWidgetNavMessage = { type: 'navigate', path }

    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(EXAM_FLOATING_WIDGET_NAV_CHANNEL)
        channel.postMessage(message)
        channel.close()
    }

    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
        window.opener.postMessage(message, window.location.origin)
        window.opener.focus()
    }
}
