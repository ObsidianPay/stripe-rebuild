import { Hono } from 'hono'
import {
  customers as seedCustomers,
  subscriptions as seedSubscriptions,
  paymentIntents as seedPaymentIntents,
  invoices as seedInvoices,
  type Customer,
} from '../data/seed.js'

const customers = [...seedCustomers]

const router = new Hono()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function listResponse<T>(data: T[], limit?: number) {
  const sliced = limit ? data.slice(0, limit) : data
  return {
    object: 'list',
    data: sliced,
    has_more: limit ? data.length > limit : false,
    total_count: data.length,
  }
}

// GET / - list all customers
router.get('/', (c) => {
  const email = c.req.query('email')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...customers]

  if (email) {
    results = results.filter((cus) => cus.email.toLowerCase() === email.toLowerCase())
  }

  return c.json(listResponse(results, limit))
})

// POST / - create customer
router.post('/', async (c) => {
  const body = await c.req.json<Partial<Customer>>()

  if (!body.email) {
    return c.json({ error: { message: 'Missing required param: email', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const newCustomer: Customer = {
    id: `cus_${generateId()}`,
    object: 'customer',
    name: body.name ?? '',
    email: body.email,
    phone: body.phone ?? '',
    created: now,
    balance: body.balance ?? 0,
    currency: body.currency ?? 'usd',
    description: body.description ?? '',
    metadata: body.metadata ?? {},
    address: body.address ?? { line1: '', line2: null, city: '', state: '', postal_code: '', country: 'US' },
    delinquent: false,
  }

  customers.unshift(newCustomer)
  return c.json(newCustomer, 201)
})

// GET /search - search customers by name or email
router.get('/search', (c) => {
  const q = c.req.query('q') ?? ''
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  const lower = q.toLowerCase()
  const results = customers.filter(
    (cus) =>
      cus.name.toLowerCase().includes(lower) ||
      cus.email.toLowerCase().includes(lower)
  )

  return c.json(listResponse(results, limit))
})

// GET /:id - get single customer
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const customer = customers.find((cus) => cus.id === id)

  if (!customer) {
    return c.json({ error: { message: `No such customer: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(customer)
})

// POST /:id - update customer
router.post('/:id', async (c) => {
  const id = c.req.param('id')
  const idx = customers.findIndex((cus) => cus.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such customer: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const body = await c.req.json<Partial<Customer>>()
  const updated: Customer = { ...customers[idx], ...body, id, object: 'customer' }
  customers[idx] = updated

  return c.json(updated)
})

// DELETE /:id - delete customer
router.delete('/:id', (c) => {
  const id = c.req.param('id')
  const idx = customers.findIndex((cus) => cus.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such customer: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  customers.splice(idx, 1)

  return c.json({ id, object: 'customer', deleted: true })
})

// GET /:id/subscriptions - get customer's subscriptions
router.get('/:id/subscriptions', (c) => {
  const id = c.req.param('id')
  const customer = customers.find((cus) => cus.id === id)

  if (!customer) {
    return c.json({ error: { message: `No such customer: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const subs = seedSubscriptions.filter((sub) => sub.customer === id)
  return c.json(listResponse(subs))
})

// GET /:id/payment_intents - get customer's payment intents
router.get('/:id/payment_intents', (c) => {
  const id = c.req.param('id')
  const customer = customers.find((cus) => cus.id === id)

  if (!customer) {
    return c.json({ error: { message: `No such customer: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined
  const pis = seedPaymentIntents.filter((pi) => pi.customer === id)
  return c.json(listResponse(pis, limit))
})

// GET /:id/invoices - get customer's invoices
router.get('/:id/invoices', (c) => {
  const id = c.req.param('id')
  const customer = customers.find((cus) => cus.id === id)

  if (!customer) {
    return c.json({ error: { message: `No such customer: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined
  const inv = seedInvoices.filter((inv) => inv.customer === id)
  return c.json(listResponse(inv, limit))
})

// GET /:id/payment_methods - stub payment methods
router.get('/:id/payment_methods', (c) => {
  const id = c.req.param('id')
  const customer = customers.find((cus) => cus.id === id)

  if (!customer) {
    return c.json({ error: { message: `No such customer: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const stubMethods = [
    {
      id: `pm_1${id.replace('cus_', '')}`,
      object: 'payment_method',
      type: 'card',
      customer: id,
      created: customer.created,
      billing_details: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2027,
        fingerprint: 'ABCDEFghijklmn12',
        funding: 'credit',
        country: 'US',
      },
    },
  ]

  return c.json(listResponse(stubMethods))
})

export default router
