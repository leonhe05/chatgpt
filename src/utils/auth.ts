import { sha256 } from 'js-sha256'
import { sql, Client } from "@vercel/postgres";

interface AuthPayload {
  t: number
  m: string
}

async function digestMessage(message: string) {
  if (typeof crypto !== 'undefined' && crypto?.subtle?.digest) {
    const msgUint8 = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    return sha256(message).toString()
  }
}

export const generateSignature = async(payload: AuthPayload) => {
  const { t: timestamp, m: lastMessage } = payload
  const secretKey = import.meta.env.PUBLIC_SECRET_KEY as string
  const signText = `${timestamp}:${lastMessage}:${secretKey}`
  // eslint-disable-next-line no-return-await
  return await digestMessage(signText)
}

export const verifySignature = async(payload: AuthPayload, sign: string) => {
  // if (Math.abs(payload.t - Date.now()) > 1000 * 60 * 5) {
  //   return false
  // }
  const payloadSign = await generateSignature(payload)
  return payloadSign === sign
}

const client = new Client({
  user: 'default',
  database: 'verceldb',
  password: 's90PUBEMkZoJ',
  host: 'ep-crimson-moon-652278-pooler.us-west-2.postgres.vercel-storage.com'
})

export const verifyKey = async() => {
  await client.connect();
  const result = await sql`SELECT * FROM members;`;
  // Equivalent to: await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  await client.end();

  console.log(result)
}



