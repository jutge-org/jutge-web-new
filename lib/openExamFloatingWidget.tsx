'use client'

import { EXAM_FLOATING_WIDGET_SIZE_PX, ExamFloatingWidget } from '@/components/live/ExamFloatingWidget'
import { notifyExamFloatingWidgetClose } from '@/lib/examFloatingWidget'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const POPUP_WINDOW_NAME = 'jutgeExamFloatingWidget'
const POPUP_ROUTE = '/exam-floating-widget'

let pipRoot: Root | null = null
let pipWindow: Window | null = null
let popupWindow: Window | null = null

function copyStyleSheets(sourceDocument: Document, targetDocument: Document) {
    for (const node of sourceDocument.head.querySelectorAll('style, link[rel="stylesheet"]')) {
        targetDocument.head.appendChild(node.cloneNode(true))
    }
}

function teardownPip() {
    pipRoot?.unmount()
    pipRoot = null
    pipWindow = null
}

async function openDocumentPictureInPicture(): Promise<boolean> {
    if (!('documentPictureInPicture' in window) || !window.documentPictureInPicture) {
        return false
    }

    if (pipWindow && !pipWindow.closed) {
        pipWindow.focus()
        return true
    }

    teardownPip()

    const pip = await window.documentPictureInPicture.requestWindow({
        width: EXAM_FLOATING_WIDGET_SIZE_PX,
        height: EXAM_FLOATING_WIDGET_SIZE_PX,
    })

    pipWindow = pip
    copyStyleSheets(document, pip.document)

    const html = pip.document.documentElement
    html.className = document.documentElement.className
    html.style.height = '100%'

    pip.document.body.className = document.body.className
    pip.document.body.style.margin = '0'
    pip.document.body.style.height = '100%'
    pip.document.body.style.overflow = 'hidden'

    const mount = pip.document.createElement('div')
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