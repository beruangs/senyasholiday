import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, page } = await req.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
      console.error('Discord webhook URL not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Create Discord embed
    const embed = {
      title: '💡 Saran & Kritik Baru',
      color: 0x3B82F6, // Blue color
      fields: [
        {
          name: '👤 Nama',
          value: name || 'Anonymous',
          inline: true,
        },
        {
          name: '📧 Email',
          value: email || 'Tidak disebutkan',
          inline: true,
        },
        {
          name: '📄 Halaman',
          value: page || 'Unknown',
          inline: false,
        },
        {
          name: '💬 Pesan',
          value: message.substring(0, 1024), // Discord limit
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SenYas Holiday - Feedback System',
      },
    }

    // Send to Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    if (!discordResponse.ok) {
      throw new Error('Failed to send to Discord')
    }

    return NextResponse.json({ success: true, message: 'Feedback sent successfully' })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback', details: (error as Error).message },
      { status: 500 }
    )
  }
}
