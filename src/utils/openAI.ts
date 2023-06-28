

export const generatePayload = (body): RequestInit & { dispatcher?: any } => ({
  headers: {
    'authority': "southeastasia.api.speech.microsoft.com",
    'accept': "*/*",
    'accept-language': "zh-CN,zh;q=0.9",
    'customvoiceconnectionid': "1asjf-124kjas8-234j21j-asdf",
    'origin': "https://speech.microsoft.com",
    "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    "content-type": "application/json"
  },
  method: 'POST',
  body: JSON.stringify(body),
})
