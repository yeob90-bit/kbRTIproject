/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { parseLoanText } from './api/_lib/parseLoanCore.js'
import { createChatWebResponse } from './api/_lib/chatAgent.js'
import {
  assertAllowedOrigin,
  buildClearedSessionCookie,
  buildSessionCookie,
  createSessionToken,
  getClientIp,
  getSessionTokenFromCookieHeader,
  shouldUseSecureCookie,
  verifyAccessCode,
  verifySessionToken,
  assertAuthenticated,
} from './api/_lib/accessAuth.js'
import { checkRateLimit } from './api/_lib/rateLimit.js'

function readRequestBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('BODY_TOO_LARGE'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function toHeaderRecord(req: IncomingMessage): Record<string, string | string[] | undefined> {
  return req.headers as Record<string, string | string[] | undefined>
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

function gateLocalAiRequest(req: IncomingMessage, authSecret: string | undefined): { ok: true } | { ok: false; status: number; message: string } {
  const headers = toHeaderRecord(req)
  const originCheck = assertAllowedOrigin(headers)
  if (!originCheck.ok) return originCheck

  const authCheck = assertAuthenticated(headers, authSecret)
  if (!authCheck.ok) return authCheck

  const clientKey = `ai:${getClientIp(headers, req.socket?.remoteAddress)}`
  const rate = checkRateLimit(clientKey)
  if (!rate.ok) return rate

  return { ok: true }
}

/**
 * 로컬 Vite 개발 서버에서 /api/* 를 처리한다.
 * 프로덕션과 동일하게 Access Code 세션·Origin·Rate Limit을 적용한다.
 */
function localApiPlugin(env: {
  geminiApiKey: string | undefined
  accessCode: string | undefined
  authSecret: string | undefined
}): Plugin {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]

        if (url === '/api/auth') {
          void (async () => {
            const headers = toHeaderRecord(req)

            if (req.method === 'GET') {
              const originCheck = assertAllowedOrigin(headers)
              if (!originCheck.ok) {
                sendJson(res, originCheck.status, { authenticated: false, message: originCheck.message })
                return
              }
              const token = getSessionTokenFromCookieHeader(
                typeof headers.cookie === 'string' ? headers.cookie : undefined,
              )
              sendJson(res, 200, { authenticated: verifySessionToken(token, env.authSecret) })
              return
            }

            if (req.method !== 'POST') {
              sendJson(res, 405, { message: '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.' })
              return
            }

            const originCheck = assertAllowedOrigin(headers)
            if (!originCheck.ok) {
              sendJson(res, originCheck.status, { message: originCheck.message })
              return
            }

            const rate = checkRateLimit(`auth:${getClientIp(headers, req.socket?.remoteAddress)}`)
            if (!rate.ok) {
              sendJson(res, rate.status, { message: rate.message })
              return
            }

            try {
              const rawBody = await readRequestBody(req, 4_000)
              let accessCode = ''
              try {
                const parsed = JSON.parse(rawBody) as { accessCode?: unknown }
                accessCode = typeof parsed.accessCode === 'string' ? parsed.accessCode : ''
              } catch {
                sendJson(res, 400, { message: '요청 형식이 올바르지 않습니다.' })
                return
              }

              if (!accessCode.trim()) {
                sendJson(res, 400, { message: 'Access Code를 입력해 주세요.' })
                return
              }

              if (!env.authSecret || env.authSecret.length < 16) {
                sendJson(res, 500, { message: '서버 인증 설정 오류입니다. AUTH_SECRET을 확인해 주세요.' })
                return
              }

              if (!verifyAccessCode(accessCode, env.accessCode)) {
                sendJson(res, 401, { message: 'Access Code가 올바르지 않습니다.' })
                return
              }

              const token = createSessionToken(env.authSecret)
              res.setHeader('Set-Cookie', buildSessionCookie(token, shouldUseSecureCookie(headers)))
              sendJson(res, 200, { ok: true })
            } catch (error) {
              if (error instanceof Error && error.message === 'BODY_TOO_LARGE') {
                sendJson(res, 413, { message: '요청 본문이 너무 큽니다.' })
                return
              }
              console.error('[auth-dev-api]', error)
              sendJson(res, 500, { message: '인증 처리 중 오류가 발생했습니다.' })
            }
          })()
          return
        }

        if (url === '/api/logout') {
          void (async () => {
            if (req.method !== 'POST') {
              sendJson(res, 405, { message: '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.' })
              return
            }
            const headers = toHeaderRecord(req)
            const originCheck = assertAllowedOrigin(headers)
            if (!originCheck.ok) {
              sendJson(res, originCheck.status, { message: originCheck.message })
              return
            }
            res.setHeader('Set-Cookie', buildClearedSessionCookie(shouldUseSecureCookie(headers)))
            sendJson(res, 200, { ok: true })
          })()
          return
        }

        if (url === '/api/parse-loan') {
          void (async () => {
            if (req.method !== 'POST') {
              sendJson(res, 405, { message: '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.' })
              return
            }

            const gate = gateLocalAiRequest(req, env.authSecret)
            if (!gate.ok) {
              sendJson(res, gate.status, { message: gate.message, error: gate.message })
              return
            }

            try {
              const rawBody = await readRequestBody(req, 20_000)
              let text = ''
              try {
                const parsed = JSON.parse(rawBody) as { text?: unknown }
                text = typeof parsed.text === 'string' ? parsed.text : ''
              } catch {
                sendJson(res, 400, { message: '입력값이 없거나 요청 형식이 올바르지 않습니다.' })
                return
              }

              const result = await parseLoanText(text, env.geminiApiKey)
              if (!result.ok) {
                sendJson(res, result.status, { message: result.message })
                return
              }

              sendJson(res, 200, result.data)
            } catch (error) {
              if (error instanceof Error && error.message === 'BODY_TOO_LARGE') {
                sendJson(res, 413, { message: '요청 본문이 너무 큽니다.' })
                return
              }
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

            const gate = gateLocalAiRequest(req, env.authSecret)
            if (!gate.ok) {
              sendJson(res, gate.status, { message: gate.message, error: gate.message })
              return
            }

            try {
              const rawBody = await readRequestBody(req, 100_000)
              let body: unknown
              try {
                body = JSON.parse(rawBody)
              } catch {
                sendJson(res, 400, { message: '요청 형식이 올바르지 않습니다.' })
                return
              }

              const webRes = await createChatWebResponse(body, env.geminiApiKey)
              await pipeWebResponse(webRes, res)
            } catch (error) {
              if (error instanceof Error && error.message === 'BODY_TOO_LARGE') {
                sendJson(res, 413, { message: '요청 본문이 너무 큽니다.' })
                return
              }
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
  const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
  const accessCode = env.ACCESS_CODE || process.env.ACCESS_CODE
  const authSecret = env.AUTH_SECRET || process.env.AUTH_SECRET

  return {
    plugins: [react(), localApiPlugin({ geminiApiKey, accessCode, authSecret })],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: true,
      include: ['src/test/**/*.test.ts', 'api/**/*.test.ts'],
    },
  }
})
