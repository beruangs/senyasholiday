'use client'

import { useParams } from 'next/navigation'
import PublicPlanView from '@/components/PublicPlanView'

export default function PublicPlanPage() {
  const params = useParams()
  const id = params.id as string

  return <PublicPlanView planIdOrSlug={id} />
}
