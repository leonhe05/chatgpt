// #vercel-disable-blocks
import {  fetch } from 'undici'
// #vercel-end
import { generatePayload } from '@/utils/openAI'
import type { APIRoute } from 'astro'
import {verifySignature} from "@/utils/auth";

export const post: APIRoute = async(context) => {
  const { ssml: ssml, sign: sign, time: time, format: format } = await context.request.json()
  if (!await verifySignature({t: time, m: ssml}, sign)) {
    return new Response(JSON.stringify({
      error: {
        code: 'Forbidden',
        message: 'You don’t have permission to access this resource.',
      },
    }), { status: 400 })
  }

  const body = {
    "offsetInPlainText": 0,
    "properties": {
      "SpeakTriggerSource": "AccTuningPagePlayButton"
    },
    ssml,
    'ttsAudioFormat': format
  }
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

  return new Response(response.body, { headers : {
      'Access-Control-Allow-Origin': '*',
      "Access-Control-Allow-Methods": "POST,GET,OPTIONS,DELETE,HEAD,PUT,PATCH",
      "Access-Control-Max-Age": "36000",
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept,Authorization,authorization",
      "Access-Control-Allow-Credentials":"true",
      'Content-Type': 'audio/mpeg'
    }, status: response.status })
}
