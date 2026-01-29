'use client'

import { useParams } from 'next/navigation'
import PublicPlanView from '@/components/PublicPlanView'

export default function SlugPlanPage() {
    const params = useParams()
    const slug = params.slug as string

    return <PublicPlanView planIdOrSlug={slug} />
}
