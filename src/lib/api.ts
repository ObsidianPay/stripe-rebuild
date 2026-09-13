const BASE = '/api/v1'

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface Address {
  city: string | null
  country: string | null
  line1: string | null
  line2: string | null
  postal_code: string | null
  state: string | null
}

export interface Customer {
  id: string
  object: 'customer'
  email: string | null
  name: string | null
  phone: string | null
  description: string | null
  address: Address | null
  balance: number
  currency: string | null
  created: number
  delinquent: boolean | null
  livemode: boolean
  metadata: Record<string, string>
  default_source: string | null
}

export interface PaymentMethodCard {
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  country: string | null
  funding: string
}

export interface PaymentMethod {
  id: string
  object: 'payment_method'
  type: string
  card?: PaymentMethodCard
  customer: string | null
  created: number
  livemode: boolean
  metadata: Record<string, string>
}

export interface PaymentIntent {
  id: string
  object: 'payment_intent'
  amount: number
  amount_received: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded'
  description: string | null
  customer: string | null
  payment_method: string | null
  capture_method: string
  confirmation_method: string
  created: number
  livemode: boolean
  metadata: Record<string, string>
  last_payment_error: { message: string } | null
  canceled_at: number | null
  cancellation_reason: string | null
  receipt_email: string | null
}

export interface SubscriptionItem {
  id: string
  object: 'subscription_item'
  price: Price
  quantity: number
  created: number
  metadata: Record<string, string>
}

export interface Subscription {
  id: string
  object: 'subscription'
  customer: string
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused'
  items: { data: SubscriptionItem[] }
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at: number | null
  trial_start: number | null
  trial_end: number | null
  created: number
  livemode: boolean
  metadata: Record<string, string>
  default_payment_method: string | null
  latest_invoice: string | null
}

export interface InvoiceLine {
  id: string
  object: 'line_item'
  amount: number
  currency: string
  description: string | null
  quantity: number
  period: { start: number; end: number }
  price: Price | null
}

export interface Invoice {
  id: string
  object: 'invoice'
  customer: string | null
  subscription: string | null
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  amount_due: number
  amount_paid: number
  amount_remaining: number
  currency: string
  created: number
  due_date: number | null
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  lines: { data: InvoiceLine[] }
  number: string | null
  paid: boolean
  period_start: number
  period_end: number
  livemode: boolean
  metadata: Record<string, string>
  description: string | null
  receipt_number: string | null
}

export interface Product {
  id: string
  object: 'product'
  name: string
  description: string | null
  active: boolean
  images: string[]
  created: number
  updated: number
  livemode: boolean
  metadata: Record<string, string>
  unit_label: string | null
  url: string | null
}

export interface Recurring {
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  usage_type: 'licensed' | 'metered'
  aggregate_usage: string | null
}

export interface Price {
  id: string
  object: 'price'
  product: string
  active: boolean
  currency: string
  unit_amount: number | null
  type: 'one_time' | 'recurring'
  recurring: Recurring | null
  created: number
  livemode: boolean
  metadata: Record<string, string>
  nickname: string | null
  billing_scheme: string
}

export interface PaymentLink {
  id: string
  object: 'payment_link'
  active: boolean
  url: string
  line_items?: { data: Array<{ price: Price; quantity: number }> }
  created: number
  livemode: boolean
  metadata: Record<string, string>
  after_completion: { type: string; redirect?: { url: string } }
}

export interface CheckoutSession {
  id: string
  object: 'checkout.session'
  url: string | null
  status: 'open' | 'complete' | 'expired'
  payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  customer: string | null
  customer_email: string | null
  amount_total: number | null
  currency: string | null
  created: number
  expires_at: number
  livemode: boolean
  metadata: Record<string, string>
  line_items?: { data: Array<{ price: Price; quantity: number; amount_total: number }> }
}

export interface BalanceAmount {
  amount: number
  currency: string
}

export interface Balance {
  object: 'balance'
  available: BalanceAmount[]
  pending: BalanceAmount[]
  livemode: boolean
}

export interface BalanceTransaction {
  id: string
  object: 'balance_transaction'
  amount: number
  currency: string
  description: string | null
  fee: number
  net: number
  status: 'available' | 'pending'
  type: string
  created: number
  available_on: number
  source: string | null
}

export interface Event {
  id: string
  object: 'event'
  type: string
  data: { object: Record<string, unknown> }
  created: number
  livemode: boolean
  pending_webhooks: number
  request: { id: string | null; idempotency_key: string | null } | null
}

export interface Refund {
  id: string
  object: 'refund'
  amount: number
  currency: string
  charge: string | null
  payment_intent: string | null
  reason: string | null
  status: 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'canceled'
  created: number
  metadata: Record<string, string>
  receipt_number: string | null
  failure_reason: string | null
}

export interface Dispute {
  id: string
  object: 'dispute'
  amount: number
  currency: string
  charge: string
  payment_intent: string | null
  reason: string
  status: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost'
  created: number
  evidence_details: { due_by: number; has_evidence: boolean; past_due: boolean; submission_count: number }
  is_charge_refundable: boolean
  livemode: boolean
  metadata: Record<string, string>
}

export interface ListResponse<T> {
  object: 'list'
  data: T[]
  has_more: boolean
  total_count?: number
  url: string
}

// ─── Generic Fetch Helper ─────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`
    try {
      const err = await res.json()
      message = err?.error?.message ?? err?.message ?? message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return ''
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return q ? `?${q}` : ''
}

// ─── Customers ────────────────────────────────────────────────────────────────

export const customersApi = {
  list: (params?: { email?: string; limit?: number; starting_after?: string }) =>
    request<ListResponse<Customer>>(`/customers${buildQuery(params)}`),

  create: (data: Partial<Customer>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    request<Customer>(`/customers/${id}`),

  update: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/customers/${id}`, { method: 'DELETE' }),

  search: (q: string) =>
    request<ListResponse<Customer>>(`/customers/search${buildQuery({ query: q })}`),

  getSubscriptions: (id: string) =>
    request<ListResponse<Subscription>>(`/customers/${id}/subscriptions`),

  getPayments: (id: string) =>
    request<ListResponse<PaymentIntent>>(`/customers/${id}/payment_intents`),

  getInvoices: (id: string) =>
    request<ListResponse<Invoice>>(`/customers/${id}/invoices`),

  getPaymentMethods: (id: string) =>
    request<ListResponse<PaymentMethod>>(`/customers/${id}/payment_methods`),
}

// ─── PaymentIntents ───────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (params?: { customer?: string; limit?: number; starting_after?: string }) =>
    request<ListResponse<PaymentIntent>>(`/payment_intents${buildQuery(params)}`),

  get: (id: string) =>
    request<PaymentIntent>(`/payment_intents/${id}`),

  create: (data: { amount: number; currency: string; customer?: string; description?: string; payment_method?: string; metadata?: Record<string, string> }) =>
    request<PaymentIntent>('/payment_intents', { method: 'POST', body: JSON.stringify(data) }),

  confirm: (id: string, data?: { payment_method?: string }) =>
    request<PaymentIntent>(`/payment_intents/${id}/confirm`, { method: 'POST', body: JSON.stringify(data ?? {}) }),

  cancel: (id: string) =>
    request<PaymentIntent>(`/payment_intents/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }),
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptionsApi = {
  list: (params?: { customer?: string; status?: string; limit?: number; starting_after?: string }) =>
    request<ListResponse<Subscription>>(`/subscriptions${buildQuery(params)}`),

  get: (id: string) =>
    request<Subscription>(`/subscriptions/${id}`),

  create: (data: { customer: string; items: Array<{ price: string; quantity?: number }>; trial_end?: number; metadata?: Record<string, string> }) =>
    request<Subscription>('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<{ cancel_at_period_end: boolean; metadata: Record<string, string>; default_payment_method: string }>) =>
    request<Subscription>(`/subscriptions/${id}`, { method: 'POST', body: JSON.stringify(data) }),

  cancel: (id: string) =>
    request<Subscription>(`/subscriptions/${id}`, { method: 'DELETE' }),

  pause: (id: string) =>
    request<Subscription>(`/subscriptions/${id}/pause`, { method: 'POST', body: JSON.stringify({}) }),

  resume: (id: string) =>
    request<Subscription>(`/subscriptions/${id}/resume`, { method: 'POST', body: JSON.stringify({}) }),
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoicesApi = {
  list: (params?: { customer?: string; status?: string; subscription?: string; limit?: number; starting_after?: string }) =>
    request<ListResponse<Invoice>>(`/invoices${buildQuery(params)}`),

  get: (id: string) =>
    request<Invoice>(`/invoices/${id}`),

  create: (data: { customer: string; subscription?: string; description?: string; metadata?: Record<string, string> }) =>
    request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),

  finalize: (id: string) =>
    request<Invoice>(`/invoices/${id}/finalize`, { method: 'POST', body: JSON.stringify({}) }),

  pay: (id: string) =>
    request<Invoice>(`/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify({}) }),

  void: (id: string) =>
    request<Invoice>(`/invoices/${id}/void`, { method: 'POST', body: JSON.stringify({}) }),

  send: (id: string) =>
    request<Invoice>(`/invoices/${id}/send`, { method: 'POST', body: JSON.stringify({}) }),
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: { active?: boolean; limit?: number; starting_after?: string }) =>
    request<ListResponse<Product>>(`/products${buildQuery(params)}`),

  get: (id: string) =>
    request<Product>(`/products/${id}`),

  create: (data: { name: string; description?: string; images?: string[]; metadata?: Record<string, string>; unit_label?: string }) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<{ name: string; description: string; active: boolean; images: string[]; metadata: Record<string, string> }>) =>
    request<Product>(`/products/${id}`, { method: 'POST', body: JSON.stringify(data) }),

  archive: (id: string) =>
    request<Product>(`/products/${id}`, { method: 'POST', body: JSON.stringify({ active: false }) }),
}

// ─── Prices ───────────────────────────────────────────────────────────────────

export const pricesApi = {
  list: (params?: { product?: string; active?: boolean; limit?: number }) =>
    request<ListResponse<Price>>(`/prices${buildQuery(params)}`),

  create: (data: { product: string; currency: string; unit_amount: number; recurring?: { interval: string; interval_count?: number }; nickname?: string; metadata?: Record<string, string> }) =>
    request<Price>('/prices', { method: 'POST', body: JSON.stringify(data) }),
}

// ─── Payment Links ────────────────────────────────────────────────────────────

export const paymentLinksApi = {
  list: (params?: { active?: boolean; limit?: number }) =>
    request<ListResponse<PaymentLink>>(`/payment_links${buildQuery(params)}`),

  get: (id: string) =>
    request<PaymentLink>(`/payment_links/${id}`),

  create: (data: { line_items: Array<{ price: string; quantity: number }>; after_completion?: { type: string; redirect?: { url: string } }; metadata?: Record<string, string> }) =>
    request<PaymentLink>('/payment_links', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<{ active: boolean; metadata: Record<string, string> }>) =>
    request<PaymentLink>(`/payment_links/${id}`, { method: 'POST', body: JSON.stringify(data) }),
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const checkoutApi = {
  createSession: (data: {
    line_items: Array<{ price: string; quantity: number }>
    mode: 'payment' | 'subscription' | 'setup'
    success_url: string
    cancel_url: string
    customer?: string
    customer_email?: string
    metadata?: Record<string, string>
  }) =>
    request<CheckoutSession>('/checkout/sessions', { method: 'POST', body: JSON.stringify(data) }),

  getSession: (id: string) =>
    request<CheckoutSession>(`/checkout/sessions/${id}`),
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export const balanceApi = {
  get: () =>
    request<Balance>('/balance'),

  getHistory: (params?: { limit?: number; starting_after?: string; type?: string }) =>
    request<ListResponse<BalanceTransaction>>(`/balance_transactions${buildQuery(params)}`),
}

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (params?: { type?: string; limit?: number; starting_after?: string }) =>
    request<ListResponse<Event>>(`/events${buildQuery(params)}`),

  get: (id: string) =>
    request<Event>(`/events/${id}`),
}

// ─── Refunds ──────────────────────────────────────────────────────────────────

export const refundsApi = {
  list: (params?: { charge?: string; payment_intent?: string; limit?: number; starting_after?: string }) =>
    request<ListResponse<Refund>>(`/refunds${buildQuery(params)}`),

  get: (id: string) =>
    request<Refund>(`/refunds/${id}`),

  create: (data: { charge?: string; payment_intent?: string; amount?: number; reason?: string; metadata?: Record<string, string> }) =>
    request<Refund>('/refunds', { method: 'POST', body: JSON.stringify(data) }),
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export const disputesApi = {
  list: (params?: { charge?: string; payment_intent?: string; limit?: number; starting_after?: string }) =>
    request<ListResponse<Dispute>>(`/disputes${buildQuery(params)}`),

  get: (id: string) =>
    request<Dispute>(`/disputes/${id}`),

  close: (id: string) =>
    request<Dispute>(`/disputes/${id}/close`, { method: 'POST', body: JSON.stringify({}) }),
}
