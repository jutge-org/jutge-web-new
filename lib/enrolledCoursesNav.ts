export const ENROLLED_COURSES_NAV_CHANGED_EVENT = 'jutge:enrolled-courses-nav-changed'

/** Tell layout chrome (main menu courses submenu) to reload enrolled course links. */
export function notifyEnrolledCoursesNavChanged(): void {
    if (typeof window === 'undefined') {
        return
    }
    window.dispatchEvent(new CustomEvent(ENROLLED_COURSES_NAV_CHANGED_EVENT))
}
