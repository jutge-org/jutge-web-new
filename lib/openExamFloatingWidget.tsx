'use client'

import { EXAM_FLOATING_WIDGET_SIZE_PX, ExamFloatingWidget } from '@/components/live/ExamFloatingWidget'
import { notifyExamFloatingWidgetClose } from '@/lib/examFloatingWidget'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const POPUP_WINDOW_NAME = 'jutgeExamFloatingWidget'
const POPUP_ROUTE = '/exam-floating-widget'

type DocumentPictureInPictureAPI = {
    requestWindow: (options: { width: number; height: number }) => Promise<Window>
}

function getDocumentPictureInPictureAPI(): DocumentPictureInPictureAPI | undefined {
    return (window as Window & { documentPictureInPicture?: DocumentPictureInPictureAPI }).documentPictureInPicture
}

let pipRoot: Root | null = null
let pipWindow: Window | null = null
let popupWindow: Window | null = null
let pipStyleSyncCleanup: (() => void) | null = null

function styleElementKey(style: HTMLStyleElement): string {
    return (
        style.getAttribute('data-nextjs-href') ??
        style.getAttribute('data-n-href') ??
        style.getAttribute('data-precedence') ??
        `inline-${style.textContent?.length ?? 0}`
    )
}

function syncPictureInPictureStyles(sourceDocument: Document, targetDocument: Document) {
    for (const node of sourceDocument.head.querySelectorAll('link[rel="stylesheet"]')) {
        if (!(node instanceof HTMLLinkElement) || !node.href) continue
        const href = node.href
        if (targetDocument.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)) continue
        targetDocument.head.appendChild(node.cloneNode(true))
    }

    for (const node of sourceDocument.head.querySelectorAll('style')) {
        const key = styleElementKey(node)
        const selector = `style[data-jutge-pip-style="${CSS.escape(key)}"]`
        let target = targetDocument.head.querySelector(selector)
        if (!(target instanceof HTMLStyleElement)) {
            target = targetDocument.createElement('style')
            target.setAttribute('data-jutge-pip-style', key)
            targetDocument.head.appendChild(target)
        }
        if (target.textContent !== node.textContent) {
            target.textContent = node.textContent
        }
    }
}

function mirrorPictureInPictureChrome(sourceDocument: Document, targetDocument: Document) {
    const sourceHtml = sourceDocument.documentElement
    const targetHtml = targetDocument.documentElement
    targetHtml.className = sourceHtml.className
    if (sourceHtml.style.cssText) {
        targetHtml.style.cssText = sourceHtml.style.cssText
    } else {
        targetHtml.style.removeProperty('height')
        targetHtml.style.height = '100%'
    }

    const sourceBody = sourceDocument.body
    const targetBody = targetDocument.body
    targetBody.className = sourceBody.className
    targetBody.style.margin = '0'
    targetBody.style.height = '100%'
    targetBody.style.overflow = 'hidden'
}

function startPictureInPictureStyleSync(sourceDocument: Document, targetDocument: Document): () => void {
    const sync = () => {
        syncPictureInPictureStyles(sourceDocument, targetDocument)
        mirrorPictureInPictureChrome(sourceDocument, targetDocument)
    }

    sync()

    const headObserver = new MutationObserver(sync)
    headObserver.observe(sourceDocument.head, {
        childList: true,
        subtree: true,
        characterData: true,
    })

    const rootObserver = new MutationObserver(sync)
    rootObserver.observe(sourceDocument.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
    if (sourceDocument.body) {
        rootObserver.observe(sourceDocument.body, { attributes: true, attributeFilter: ['class', 'style'] })
    }

    return () => {
        headObserver.disconnect()
        rootObserver.disconnect()
    }
}

function teardownPip() {
    pipStyleSyncCleanup?.()
    pipStyleSyncCleanup = null
    pipRoot?.unmount()
    pipRoot = null
    pipWindow = null
}

async function openDocumentPictureInPicture(): Promise<boolean> {
    const docPip = getDocumentPictureInPictureAPI()
    if (!docPip) {
        return false
    }

    if (pipWindow && !pipWindow.closed) {
        pipWindow.focus()
        return true
    }

    teardownPip()

    const pip = await docPip.requestWindow({
        width: EXAM_FLOATING_WIDGET_SIZE_PX,
        height: EXAM_FLOATING_WIDGET_SIZE_PX,
    })

    pipWindow = pip
    pipStyleSyncCleanup = startPictureInPictureStyleSync(document, pip.document)

    const mount = pip.document.createElement('div')
    mount.style.display = 'flex'
    mount.style.flexDirection = 'column'
    mount.style.height = '100%'
    mount.style.minHeight = '0'
    mount.style.width = '100%'
    pip.document.body.appendChild(mount)

    pipRoot = createRoot(mount)
    pipRoot.render(createElement(ExamFloatingWidget))

    pip.addEventListener('pagehide', teardownPip, { once: true })

    return true
}

function openPopupFallback(): void {
    if (popupWindow && !popupWindow.closed) {
        popupWindow.focus()
        return
    }

    const chromeOffset = 40
    const opened = window.open(
        POPUP_ROUTE,
        POPUP_WINDOW_NAME,
        `popup=yes,width=${EXAM_FLOATING_WIDGET_SIZE_PX + chromeOffset},height=${EXAM_FLOATING_WIDGET_SIZE_PX + chromeOffset},left=100,top=100`,
    )

    if (!opened) {
        window.alert('Popup blocked. Please allow popups for this site.')
        return
    }

    popupWindow = opened
}

export function closeExamFloatingWidget(): void {
    notifyExamFloatingWidgetClose()
    if (popupWindow && !popupWindow.closed) {
        popupWindow.close()
    }
    popupWindow = null
    if (pipWindow && !pipWindow.closed) {
        pipWindow.close()
    }
    teardownPip()
}

export async function openExamFloatingWidget(): Promise<void> {
    try {
        const usedPip = await openDocumentPictureInPicture()
        if (usedPip) return
    } catch {
        teardownPip()
    }

    openPopupFallback()
}