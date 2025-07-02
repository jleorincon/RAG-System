import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/lib/api/services/chatService';

const chatService = new ChatService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, sessionId, maxTokens, temperature, useWebSearch, predictionType, confidenceLevel } = body;

    // Handle AI SDK format with messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content) {
      return NextResponse.json(
        { error: 'Last message must be from user with content' },
        { status: 400 }
      );
    }

    // Use streaming response compatible with AI SDK
    const stream = await chatService.streamChat({
      message: lastMessage.content,
      sessionId,
      maxTokens,
      temperature,
      useWebSearch,
      predictionType,
      confidenceLevel,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Format as AI SDK expects (simple text streaming)
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate chat response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 