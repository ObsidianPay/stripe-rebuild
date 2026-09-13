import { defineStore } from 'pinia'
import { ref } from 'vue'
import { customersApi, type Customer } from '@/lib/api'

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])
  const currentCustomer = ref<Customer | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCustomers(params?: { email?: string; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const res = await customersApi.list(params)
      customers.value = res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch customers'
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomer(id: string) {
    loading.value = true
    error.value = null
    try {
      currentCustomer.value = await customersApi.get(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch customer'
    } finally {
      loading.value = false
    }
  }

  async function createCustomer(data: Partial<Customer>) {
    loading.value = true
    error.value = null
    try {
      const customer = await customersApi.create(data)
      customers.value.unshift(customer)
      return customer
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create customer'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id: string, data: Partial<Customer>) {
    loading.value = true
    error.value = null
    try {
      const updated = await customersApi.update(id, data)
      const idx = customers.value.findIndex(c => c.id === id)
      if (idx !== -1) customers.value[idx] = updated
      if (currentCustomer.value?.id === id) currentCustomer.value = updated
      return updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update customer'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomer(id: string) {
    loading.value = true
    error.value = null
    try {
      await customersApi.delete(id)
      customers.value = customers.value.filter(c => c.id !== id)
      if (currentCustomer.value?.id === id) currentCustomer.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete customer'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    customers,
    currentCustomer,
    loading,
    error,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
})
