import type { Provider, ProviderRule, CreateProviderDto, CreateRuleDto } from '../types'

const BASE_URL = '/api/providers'

export async function getProviders(): Promise<Provider[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to fetch providers')
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createProvider(dto: CreateProviderDto): Promise<Provider> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to create provider')
  }
  return await res.json()
}

export async function deleteProvider(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `Failed to delete provider ${id}`)
  }
}

export async function addProviderRule(providerId: number, dto: CreateRuleDto): Promise<ProviderRule> {
  const res = await fetch(`${BASE_URL}/${providerId}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to add rule to provider')
  }
  return await res.json()
}

export async function deleteProviderRule(providerId: number, ruleId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${providerId}/rules/${ruleId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `Failed to delete rule ${ruleId}`)
  }
}
