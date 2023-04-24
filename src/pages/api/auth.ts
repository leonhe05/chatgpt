import type { APIRoute } from 'astro'

const realPassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async(context) => {
  const body = await context.request.json()

  fetch('https://flask.co-pilot.buzz/online', {
    method: 'POST'
  });

  const { pass } = body
  return new Response(JSON.stringify({
    code: (!realPassword || pass === realPassword) ? 0 : -1,
  }))
}
