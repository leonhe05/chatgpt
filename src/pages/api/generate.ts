// #vercel-disable-blocks
import { ProxyAgent, fetch } from 'undici'
// #vercel-end
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
import type { APIRoute } from 'astro'
import { verifyKey } from '@/utils/auth'
import mysql from 'serverless-mysql'

const apiKey = import.meta.env.OPENAI_API_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = (import.meta.env.OPENAI_API_BASE_URL || 'https://api.openai.com').trim().replace(/\/$/, '')
const sitePassword = import.meta.env.SITE_PASSWORD

const db = mysql({
  config: {
    host: '106.52.107.244',
    database: 'tts',
    user: 'root',
    password: 'Welcome1@3',
    port: 3306
  },
});

export const post: APIRoute = async(context) => {
  await db.connect()
  let a = Date.now()
  await fetch('https://chat.co-pilot.top/flask/online', {
    method: 'POST'
  });
  let b = Date.now()
  await fetch('https://flask.co-pilot.buzz/online', {
    method: 'POST'
  });
  let c = Date.now()
  let result = await db.query('select * from user_online limit 1;')
  let d = Date.now()
  console.log(result)
  console.log('到广州耗时:' + (b-a) + '  到洛杉矶耗时:' + (c-b), ' 直连耗时：' + (d-c))

  const body = await context.request.json()
  const { messages, pass, key } = body
  if (!messages) {
    return new Response(JSON.stringify({
      error: {
        message: 'No input text.',
      },
    }), { status: 400 })
  }
  verifyKey()
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
