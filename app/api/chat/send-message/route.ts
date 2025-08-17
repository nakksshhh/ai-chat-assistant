import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { chatId, content, userId } = await request.json()

    // Validate required fields
    if (!chatId) {
      return NextResponse.json({
        success: false,
        botResponse: null,
        error: 'chatId is required'
      }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        botResponse: null,
        error: 'userId is required'
      }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({
        success: false,
        botResponse: null,
        error: 'content is required'
      }, { status: 400 })
    }

    console.log('Sending to n8n:', { chatId, content, userId })

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/chat'

    const payload = {
      chat_id: chatId,  // Use chat_id to match your n8n workflow
      content: content.trim(),
      userId: userId,
      timestamp: new Date().toISOString()
    }

    console.log('n8n payload:', payload)

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Handle array response from n8n workflow
    const responseData = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: responseData.success || true,
      botResponse: responseData.botResponse || responseData.response || 'I received your message!',
      error: responseData.error || null
    })

  } catch (error: any) {
    console.error('Error calling n8n webhook:', error)
    
    return NextResponse.json({
      success: false,
      botResponse: null,
      error: error.message || 'Failed to process message'
    }, { status: 500 })
  }
}