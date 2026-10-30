const LEGACY_JUTGE_ORIGIN = 'https://jutge.org'
const NEW_JUTGE_ORIGIN = 'https://new.jutge.org'

/** Rewrites legacy site links in API statement HTML before it is rendered. */
export function rewriteStatementHtmlForDisplay(html: string): string {
    return html.replaceAll(LEGACY_JUTGE_ORIGIN, NEW_JUTGE_ORIGIN)
}
