import { defineStore } from 'pinia'
import { ref } from 'vue'
import { paymentsApi, type PaymentIntent } from '@/lib/api'

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref<PaymentIntent[]>([])
  const currentPayment = ref<PaymentIntent | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPayments(params?: { customer?: string; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const res = await paymentsApi.list(params)
      payments.value = res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch payments'
    } finally {
      loading.value = false
    }
  }

  async function fetchPayment(id: string) {
    loading.value = true
    error.value = null
    try {
      currentPayment.value = await paymentsApi.get(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch payment'
    } finally {
      loading.value = false
    }
  }

  async function createPayment(data: { amount: number; currency: string; customer?: string; description?: string }) {
    loading.value = true
    error.value = null
    try {
      const payment = await paymentsApi.create(data)
      payments.value.unshift(payment)
      return payment
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create payment'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function confirmPayment(id: string, paymentMethod?: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await paymentsApi.confirm(id, paymentMethod ? { payment_method: paymentMethod } : undefined)
      const idx = payments.value.findIndex(p => p.id === id)
      if (idx !== -1) payments.value[idx] = updated
      if (currentPayment.value?.id === id) currentPayment.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to confirm payment'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancelPayment(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await paymentsApi.cancel(id)
      const idx = payments.value.findIndex(p => p.id === id)
      if (idx !== -1) payments.value[idx] = updated
      if (currentPayment.value?.id === id) currentPayment.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to cancel payment'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    payments,
    currentPayment,
    loading,
    error,
    fetchPayments,
    fetchPayment,
    createPayment,
    confirmPayment,
    cancelPayment,
  }
})
