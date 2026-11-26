import jutge from '@/lib/jutge'
import { OPENWEB_SETTINGS_API_KEY, parseOpenWebSettings, type OpenWebSettings } from '@/lib/openWebSettings'
import { isStudentSettingsApiAvailable } from '@/lib/siteMode'

export async function fetchOpenWebSettings(): Promise<OpenWebSettings | null> {
    if (!isStudentSettingsApiAvailable() || !jutge.meta?.token) {
        return null
    }

    try {
        const value = await jutge.student.settings.get(OPENWEB_SETTINGS_API_KEY)
        if (value === null || value === undefined) {
            return null
        }

        return parseOpenWebSettings(value)
    } catch {
        return null
    }
}

export async function saveOpenWebSettings(settings: OpenWebSettings): Promise<void> {
    if (!isStudentSettingsApiAvailable()) {
        return
    }

    if (!jutge.meta?.token) {
        throw new Error('Not authenticated')
    }

    await jutge.student.settings.set({
        key: OPENWEB_SETTINGS_API_KEY,
        value: settings,
    })
}
