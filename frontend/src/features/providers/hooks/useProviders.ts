import { useState, useEffect, useCallback } from 'react'
import type { Provider, CreateRuleDto } from '../types'
import {
  getProviders,
  createProvider,
  deleteProvider,
  addProviderRule,
  deleteProviderRule,
} from '../api/providersApi'

export function useProviders(autoFetch = false) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProviders()
      setProviders(data)
      // update selectedProvider if active
      setSelectedProvider((prev) => {
        if (!prev) return null
        return data.find((p) => p.id === prev.id) || null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching providers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchProviders()
    }
  }, [autoFetch, fetchProviders])

  const selectProvider = useCallback((provider: Provider) => {
    setSelectedProvider(provider)
  }, [])

  const deselectProvider = useCallback(() => {
    setSelectedProvider(null)
  }, [])

  const addProviderAction = useCallback(async (name: string) => {
    try {
      setIsSubmitting(true)
      setError(null)
      const created = await createProvider({ name })
      setProviders((prev) => [...prev, created])
      return created
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error creating provider'
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const deleteProviderAction = useCallback(async (id: number) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await deleteProvider(id)
      setProviders((prev) => prev.filter((p) => p.id !== id))
      setSelectedProvider((prev) => (prev?.id === id ? null : prev))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting provider'
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const addRuleAction = useCallback(async (providerId: number, dto: CreateRuleDto) => {
    try {
      setIsSubmitting(true)
      setError(null)
      const newRule = await addProviderRule(providerId, dto)
      setProviders((prev) =>
        prev.map((p) => {
          if (p.id !== providerId) return p
          return {
            ...p,
            rules: [...p.rules, newRule],
          }
        })
      )
      setSelectedProvider((prev) => {
        if (!prev || prev.id !== providerId) return prev
        return {
          ...prev,
          rules: [...prev.rules, newRule],
        }
      })
      return newRule
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error adding provider rule'
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const deleteRuleAction = useCallback(async (providerId: number, ruleId: number) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await deleteProviderRule(providerId, ruleId)
      setProviders((prev) =>
        prev.map((p) => {
          if (p.id !== providerId) return p
          return {
            ...p,
            rules: p.rules.filter((r) => r.id !== ruleId),
          }
        })
      )
      setSelectedProvider((prev) => {
        if (!prev || prev.id !== providerId) return prev
        return {
          ...prev,
          rules: prev.rules.filter((r) => r.id !== ruleId),
        }
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting provider rule'
      setError(msg)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    providers,
    selectedProvider,
    loading,
    error,
    isSubmitting,
    fetchProviders,
    selectProvider,
    deselectProvider,
    addProviderAction,
    deleteProviderAction,
    addRuleAction,
    deleteRuleAction,
  }
}
