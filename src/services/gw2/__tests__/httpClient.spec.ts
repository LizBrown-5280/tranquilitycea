import { afterEach, describe, expect, it, vi } from 'vitest'

import { createGw2HttpClient } from '@/services/gw2/httpClient'

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response
}

describe('createGw2HttpClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retries transient failures and eventually succeeds', async () => {
    const fetchMock = vi
      .fn<(input: URL | RequestInfo, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce(jsonResponse({ value: 'ok' }))

    vi.stubGlobal('fetch', fetchMock)

    const client = createGw2HttpClient({
      retry: {
        retries: 1,
        baseDelayMs: 1,
      },
    })

    const result = await client.requestJson<{ value: string }>('/v2/build')

    expect(result.ok).toBe(true)
    expect(result.data).toEqual({ value: 'ok' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('enforces bounded concurrency', async () => {
    let activeCount = 0
    let maxActiveCount = 0

    const fetchMock = vi.fn(async () => {
      activeCount += 1
      maxActiveCount = Math.max(maxActiveCount, activeCount)

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 15)
      })

      activeCount -= 1
      return jsonResponse({ ok: true })
    })

    vi.stubGlobal('fetch', fetchMock)

    const client = createGw2HttpClient({
      concurrency: 2,
      retry: {
        retries: 0,
        baseDelayMs: 1,
      },
    })

    const requests = Array.from({ length: 5 }, (_, index) =>
      client.requestJson(`/v2/mock/${index}`),
    )

    const responses = await Promise.all(requests)

    expect(responses.every((response) => response.ok)).toBe(true)
    expect(maxActiveCount).toBeLessThanOrEqual(2)
  })

  it('uses access_token query auth by default', async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = new URL(String(input))

      const headers = new Headers(init?.headers)
      return jsonResponse({
        token: url.searchParams.get('access_token'),
        authorization: headers.get('Authorization'),
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const client = createGw2HttpClient({
      apiKey: 'abc123',
    })

    const result = await client.requestJson<{ token: string | null; authorization: string | null }>(
      '/v2/account',
    )

    expect(result.ok).toBe(true)
    expect(result.data?.token).toBe('abc123')
    expect(result.data?.authorization).toBeNull()

    const fetchCall = fetchMock.mock.calls[0]
    const calledUrl = new URL(String(fetchCall?.[0]))
    expect(calledUrl.searchParams.get('access_token')).toBe('abc123')
  })

  it('supports Authorization header auth mode when requested', async () => {
    const fetchMock = vi.fn(async (_input: URL | RequestInfo, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      return jsonResponse({
        authorization: headers.get('Authorization'),
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const client = createGw2HttpClient({
      apiKey: 'abc123',
      authMode: 'header',
    })

    const result = await client.requestJson<{ authorization: string | null }>('/v2/account')

    expect(result.ok).toBe(true)
    expect(result.data?.authorization).toBe('Bearer abc123')

    const fetchCall = fetchMock.mock.calls[0]
    const url = new URL(String(fetchCall?.[0]))
    expect(url.searchParams.get('access_token')).toBeNull()
  })
})
