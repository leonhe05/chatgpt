import { createParser } from 'eventsource-parser'
import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import type { ChatMessage } from '@/types'

const model = import.meta.env.OPENAI_API_MODEL || 'gpt-3.5-turbo'

export const generatePayload = (apiKey: string, messages: ChatMessage[]): RequestInit & { dispatcher?: any } => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer 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`,
  },
  method: 'POST',
  body: JSON.stringify({
    model,
    messages,
    temperature: 0.6,
    stream: true,
  }),
})

export const parseOpenAIStream = (id: String, rawResponse: Response) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  if (!rawResponse.ok) {
    return new Response(rawResponse.body, {
      status: rawResponse.status,
      statusText: rawResponse.statusText,
    })
  }
  let content = ''
  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data
          if (data === '[DONE]') {
            consumeToken(id, content);
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta?.content || ''
            content += text
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(streamParser)
      for await (const chunk of rawResponse.body as any)
        parser.feed(decoder.decode(chunk))
    },
  })
  const headers = new Headers()
  headers.append('Access-Control-Allow-Origin', '*')
  return new Response(stream, {
    headers
  })
}

export const consumeToken = async(id: String, content: String) => {
  fetch('https://chat.co-pilot.top/gateway/consume-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      content: content,
    }),
  })
}
