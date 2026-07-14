/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { parseLoanText } from './api/_lib/parseLoanCore.js'
import { createChatWebResponse } from './api/_lib/chatAgent.js'

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function pipeWebResponse(webRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = webRes.status
  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    res.setHeader(key, value)
  })

  if (!webRes.body) {
    res.end()
    return
  }

  const reader = webRes.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) res.write(Buffer.from(value))
    }
    res.end()
  } catch (error) {
    reader.cancel().catch(() => undefined)
    if (!res.writableEnded) res.end()
    throw error
  }
}

/**
 * 로컬 Vite 개발 서버에서 /api/parse-loan, /api/chat 을 처리한다.
 */
function localApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]

        if (url === '/api/parse-loan') {
          void (async () => {
            if (req.method !== 'POST') {
              sendJson(res, 405, { message: '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.' })
              return
            }

            try {
              const rawBody = await readRequestBody(req)
              let text = ''
              try {
                const parsed = JSON.parse(rawBody) as { text?: unknown }
                text = typeof parsed.text === 'string' ? parsed.text : ''
              } catch {
                sendJson(res, 400, { message: '입력값이 없거나 요청 형식이 올바르지 않습니다.' })
                return
              }

              const result = await parseLoanText(text, apiKey)
              if (!result.ok) {
                sendJson(res, result.status, { message: result.message })
                return
              }

              sendJson(res, 200, result.data)
            } catch (error) {
              console.error('[parse-loan-dev-api]', error)
              sendJson(res, 500, { message: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' })
            }
          })()
          return
        }

        if (url === '/api/chat') {
          void (async () => {
            if (req.method !== 'POST') {
              sendJson(res, 405, { message: '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.' })
              return
            }

            try {
              const rawBody = await readRequestBody(req)
              let body: unknown
              try {
                body = JSON.parse(rawBody)
              } catch {
                sendJson(res, 400, { message: '요청 형식이 올바르지 않습니다.' })
                return
              }

              const webRes = await createChatWebResponse(body, apiKey)
              await pipeWebResponse(webRes, res)
            } catch (error) {
              console.error('[chat-dev-api]', error)
              if (!res.headersSent) {
                sendJson(res, 500, { message: '상담 Agent 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' })
              } else if (!res.writableEnded) {
                res.end()
              }
            }
          })()
          return
        }

        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

  return {
    plugins: [react(), localApiPlugin(apiKey)],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: true,
    },
  }
})
