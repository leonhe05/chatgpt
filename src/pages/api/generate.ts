// #vercel-disable-blocks
import { ProxyAgent, fetch } from 'undici'
// #vercel-end
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
import type { APIRoute } from 'astro'
import { sql, db } from "@vercel/postgres";

const apiKey = import.meta.env.OPENAI_API_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = (import.meta.env.OPENAI_API_BASE_URL || 'https://api.openai.com').trim().replace(/\/$/, '')
const sitePassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async(context) => {

  console.log(process.env)

  let begin = new Date().getTime()
  const result = await sql`SELECT * FROM members;`;
  let end = new Date().getTime()
  console.log('sql spend: ' + (end - begin))
  console.log(result.rows)

  begin = new Date().getTime()
  await fetch('https://flask.co-pilot.buzz/online', {
    method: 'POST'
  });
  end = new Date().getTime()
  console.log('fetch spend: ' + (end - begin))


  const body = await context.request.json()
  const { messages, pass, key } = body
  if (!messages) {
    return new Response(JSON.stringify({
      error: {
        message: 'No input text.',
      },
    }), { status: 400 })
  }

  if (sitePassword && sitePassword !== pass) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid password.',
      },
    }), { status: 401 })
  }
  return new Response(JSON.stringify({
    error: {
      message: 'Invalid password.',
    },
  }), { status: 401 })
  const initOptions = generatePayload(apiKey, messages)
  // #vercel-disable-blocks
  if (httpsProxy)
    initOptions.dispatcher = new ProxyAgent(httpsProxy)
  // #vercel-end

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const response = await fetch(`${baseUrl}/v1/chat/completions`, initOptions).catch((err: Error) => {
    console.error(err)
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }) as Response

  return parseOpenAIStream(response) as Response
}
