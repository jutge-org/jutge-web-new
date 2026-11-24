export const EXAM_FLOATING_WIDGET_CLOSE_CHANNEL = 'jutge-exam-floating-widget-close'
export const EXAM_FLOATING_WIDGET_NAV_CHANNEL = 'jutge-exam-floating-widget-nav'

export type ExamFloatingWidgetNavMessage = {
    type: 'navigate'
    path: string
}

export function isExamFloatingWidgetNavPath(path: string): boolean {
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