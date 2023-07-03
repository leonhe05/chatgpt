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
    // const response = await fetch(`https://eastus.api.speech.microsoft.com/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/speak`, initOptions).catch((err: Error) => {
    //     return new Response(JSON.stringify({
    //         error: {
    //             code: err.name,
    //             message: err.message,
    //         },
    //     }), { status: 500 })
    // }) as Response

    return new Response(null, { headers : {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'audio/mpeg'
        }, status: 200 })
}
