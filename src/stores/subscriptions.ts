import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subscriptionsApi, type Subscription } from '@/lib/api'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const subscriptions = ref<Subscription[]>([])
  const currentSubscription = ref<Subscription | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSubscriptions(params?: { customer?: string; status?: string; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const res = await subscriptionsApi.list(params)
      subscriptions.value = res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch subscriptions'
    } finally {
      loading.value = false
    }
  }

  async function fetchSubscription(id: string) {
    loading.value = true
    error.value = null
    try {
      currentSubscription.value = await subscriptionsApi.get(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch subscription'
    } finally {
      loading.value = false
    }
  }

  async function createSubscription(data: { customer: string; items: Array<{ price: string; quantity?: number }>; trial_end?: number }) {
    loading.value = true
    error.value = null
    try {
      const sub = await subscriptionsApi.create(data)
      subscriptions.value.unshift(sub)
      return sub
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create subscription'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSubscription(id: string, data: Partial<{ cancel_at_period_end: boolean; metadata: Record<string, string>; default_payment_method: string }>) {
    loading.value = true
    error.value = null
    try {
      const updated = await subscriptionsApi.update(id, data)
      const idx = subscriptions.value.findIndex(s => s.id === id)
      if (idx !== -1) subscriptions.value[idx] = updated
      if (currentSubscription.value?.id === id) currentSubscription.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update subscription'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancelSubscription(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await subscriptionsApi.cancel(id)
      const idx = subscriptions.value.findIndex(s => s.id === id)
      if (idx !== -1) subscriptions.value[idx] = updated
      if (currentSubscription.value?.id === id) currentSubscription.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to cancel subscription'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function pauseSubscription(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await subscriptionsApi.pause(id)
      const idx = subscriptions.value.findIndex(s => s.id === id)
      if (idx !== -1) subscriptions.value[idx] = updated
      if (currentSubscription.value?.id === id) currentSubscription.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to pause subscription'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function resumeSubscription(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await subscriptionsApi.resume(id)
      const idx = subscriptions.value.findIndex(s => s.id === id)
      if (idx !== -1) subscriptions.value[idx] = updated
      if (currentSubscription.value?.id === id) currentSubscription.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to resume subscription'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    subscriptions,
    currentSubscription,
    loading,
    error,
    fetchSubscriptions,
    fetchSubscription,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
  }
})
