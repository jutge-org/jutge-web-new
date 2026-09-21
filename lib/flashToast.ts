const FLASH_TOAST_KEY = 'jutge.flash-toast'

type FlashToast = {
    type: 'success' | 'info' | 'error'
    message: string
}

export function queueFlashToast(toast: FlashToast) {
    sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify(toast))
}

export function consumeFlashToast(): FlashToast | null {
    const raw = sessionStorage.getItem(FLASH_TOAST_KEY)
    if (!raw) return null
    sessionStorage.removeItem(FLASH_TOAST_KEY)
    try {
        const parsed = JSON.parse(raw) as FlashToast
        if (parsed?.type !== 'success' && parsed?.type !== 'info' && parsed?.type !== 'error') return null
        if (typeof parsed.message !== 'string' || parsed.message.length === 0) return null
        return parsed
    } catch {
        return null
    }
}
