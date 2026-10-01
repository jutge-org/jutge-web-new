'use client'

import { DocumentTitle } from '@/components/general/DocumentTitle'
import { BlackScreenView } from '@/components/utilities/BlackScreenView'

export default function UtilitiesBlackScreenPage() {
    return (
        <>
            <DocumentTitle title="Black screen" />
            <BlackScreenView />
        </>
    )
}
