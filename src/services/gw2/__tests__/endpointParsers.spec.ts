import { describe, expect, it } from 'vitest'

import { ACCOUNT_ENDPOINTS, PUBLIC_ENDPOINTS } from '@/services/gw2/endpointManifest'
import {
  PARSED_ENDPOINT_IDS,
  hasEndpointParser,
  parseEndpointPayload,
} from '@/services/gw2/endpointParsers'

describe('endpointParsers contract', () => {
  it('only maps parser ids that exist in the endpoint manifest', () => {
    const manifestIds = new Set(
      [...PUBLIC_ENDPOINTS, ...ACCOUNT_ENDPOINTS].map((endpoint) => endpoint.id),
    )

    for (const parsedEndpointId of PARSED_ENDPOINT_IDS) {
      expect(manifestIds.has(parsedEndpointId)).toBe(true)
    }
  })

  it('has parser mappings for critical typed endpoints', () => {
    const requiredParserEndpoints = [...PUBLIC_ENDPOINTS, ...ACCOUNT_ENDPOINTS].map(
      (endpoint) => endpoint.id,
    )

    for (const endpointId of requiredParserEndpoints) {
      expect(hasEndpointParser(endpointId)).toBe(true)
    }
  })

  it('returns payload unchanged when endpoint has no parser mapping', () => {
    const payload = { sample: true }
    const parsed = parseEndpointPayload('some_unmapped_endpoint', payload)

    expect(parsed).toBe(payload)
  })
})
