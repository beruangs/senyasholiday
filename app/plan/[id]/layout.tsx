import { Metadata } from 'next'
import dbConnect from '@/lib/mongodb'
import { HolidayPlan } from '@/models'

type Props = {
  params: { id: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    await dbConnect()
    const plan = (await HolidayPlan.findById(params.id).lean()) as Record<string, any> | null

    if (!plan) {
      return {
        title: 'Plan Not Found | SEN YAS DADDY',
        description: 'Holiday plan not found',
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://senyasholiday.vercel.app'
    const planUrl = `${baseUrl}/plan/${params.id}`
    const imageUrl = plan.bannerImage || '/logo.png'
    const title = plan.title || 'Holiday Plan'
    const description = plan.description || 'Holiday plan managed with SEN YAS DADDY'

    return {
      title: `${title} | SEN YAS DADDY`,
      description,
      openGraph: {
        title: `${title} | SEN YAS DADDY`,
        description,
        url: planUrl,
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | SEN YAS DADDY`,
        description,
        images: [imageUrl],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Holiday Plan | SEN YAS DADDY',
      description: 'Holiday plan managed with SEN YAS DADDY',
    }
  }
}

export default function PlanLayout({ children }: Props) {
  return <>{children}</>
}
