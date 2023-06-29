// #vercel-disable-blocks
import {  fetch } from 'undici'
// #vercel-end
import { generatePayload } from '@/utils/openAI'
import type { APIRoute } from 'astro'
import {timestamp} from "solidjs-use";

export const post: APIRoute = async(context) => {
  const start = timestamp();
  const body = await context.request.json()

  const initOptions = generatePayload(body)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const response = await fetch(`https://eastus.api.speech.microsoft.com/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/speak`, initOptions).catch((err: Error) => {
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }) as Response

  console.log("耗时：" + (timestamp() - start) + "ms")
  return new Response(response.body, { headers : response.headers, status: response.status })
}
