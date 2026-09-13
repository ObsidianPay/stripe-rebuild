import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoicesApi, type Invoice } from '@/lib/api'

export const useInvoicesStore = defineStore('invoices', () => {
  const invoices = ref<Invoice[]>([])
  const currentInvoice = ref<Invoice | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchInvoices(params?: { customer?: string; status?: string; subscription?: string; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const res = await invoicesApi.list(params)
      invoices.value = res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch invoices'
    } finally {
      loading.value = false
    }
  }

  async function fetchInvoice(id: string) {
    loading.value = true
    error.value = null
    try {
      currentInvoice.value = await invoicesApi.get(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch invoice'
    } finally {
      loading.value = false
    }
  }

  async function createInvoice(data: { customer: string; subscription?: string; description?: string }) {
    loading.value = true
    error.value = null
    try {
      const invoice = await invoicesApi.create(data)
      invoices.value.unshift(invoice)
      return invoice
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create invoice'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function finalizeInvoice(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await invoicesApi.finalize(id)
      _replaceInList(id, updated)
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to finalize invoice'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function payInvoice(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await invoicesApi.pay(id)
      _replaceInList(id, updated)
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to pay invoice'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function voidInvoice(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await invoicesApi.void(id)
      _replaceInList(id, updated)
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to void invoice'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function sendInvoice(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await invoicesApi.send(id)
      _replaceInList(id, updated)
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to send invoice'
      throw e
    } finally {
      loading.value = false
    }
  }

  function _replaceInList(id: string, updated: Invoice) {
    const idx = invoices.value.findIndex(i => i.id === id)
    if (idx !== -1) invoices.value[idx] = updated
    if (currentInvoice.value?.id === id) currentInvoice.value = updated
  }

  return {
    invoices,
    currentInvoice,
    loading,
    error,
    fetchInvoices,
    fetchInvoice,
    createInvoice,
    finalizeInvoice,
    payInvoice,
    voidInvoice,
    sendInvoice,
  }
})
