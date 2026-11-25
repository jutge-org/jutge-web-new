'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function InstructorProblemDeprecationRedirectPage() {
    const { problem_nm } = useParams<{ problem_nm: string }>()
    const router = useRouter()

    useEffect(() => {
        router.replace(`/instructor/problems/${problem_nm}/dangerzone`)
    }, [problem_nm, router])

    return null
}
