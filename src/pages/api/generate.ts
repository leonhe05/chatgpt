// #vercel-disable-blocks
import {  fetch } from 'undici'
// #vercel-end
import { generatePayload } from '@/utils/openAI'
import type { APIRoute } from 'astro'

export const post: APIRoute = async(context) => {
  const body = await context.request.json()

  const initOptions = generatePayload(body)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const response = await fetch(`https://southeastasia.api.speech.microsoft.com/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/speak`, initOptions).catch((err: Error) => {
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }) as Response

  return new Response(response.body, { headers : response.headers })
}
