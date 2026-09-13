import { Hono } from 'hono'
import {
  paymentIntents as seedPaymentIntents,
  type PaymentIntent,
} from '../data/seed.js'

const paymentIntents = [...seedPaymentIntents]

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

// Map a payment intent to a charge-like object
function piToCharge(pi: PaymentIntent) {
  return {
    id: pi.id.replace('pi_', 'ch_'),
    object: 'charge',
    amount: pi.amount,
    currency: pi.currency,
    status: pi.status === 'succeeded' ? 'succeeded' : pi.status === 'canceled' ? 'failed' : 'pending',
    paid: pi.status === 'succeeded',
    refunded: false,
    customer: pi.customer,
    description: pi.description,
    created: pi.created,
    payment_method: pi.payment_method,
    payment_intent: pi.id,
    receipt_email: pi.receipt_email,
    metadata: pi.metadata,
    outcome: pi.status === 'succeeded'
      ? { network_status: 'approved_by_network', type: 'authorized', seller_message: 'Payment complete.' }
      : { network_status: 'declined_by_network', type: 'issuer_declined', seller_message: 'The bank did not return any further details with this decline.' },
    billing_details: {
      name: null,
      email: pi.receipt_email,
      phone: null,
      address: { line1: null, line2: null, city: null, state: null, postal_code: null, country: null },
    },
    amount_refunded: 0,
    failure_code: null,
    failure_message: null,
  }
}

// ─── Payment Intents ──────────────────────────────────────────────────────────

const piRouter = new Hono()

// GET / - list payment intents
piRouter.get('/', (c) => {
  const limitParam = c.req.query('limit')
  const status = c.req.query('status')
  const customer = c.req.query('customer')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...paymentIntents]

  if (status) {
    results = results.filter((pi) => pi.status === status)
  }
  if (customer) {
    results = results.filter((pi) => pi.customer === customer)
  }

  return c.json(listResponse(results, limit))
})

// POST / - create payment intent
piRouter.post('/', async (c) => {
  const body = await c.req.json<Partial<PaymentIntent>>()

  if (!body.amount || !body.currency) {
    return c.json({ error: { message: 'Missing required params: amount, currency', type: 'invalid_request_error' } }, 400)
  }

  if (typeof body.amount !== 'number' || body.amount < 1) {
    return c.json({ error: { message: 'amount must be a positive integer', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const newPI: PaymentIntent = {
    id: `pi_3${generateId()}`,
    object: 'payment_intent',
    amount: body.amount,
    currency: body.currency.toLowerCase(),
    status: 'requires_payment_method',
    customer: body.customer ?? '',
    description: body.description ?? '',
    created: now,
    payment_method: body.payment_method ?? '',
    receipt_email: body.receipt_email ?? null,
    metadata: body.metadata ?? {},
  }

  paymentIntents.unshift(newPI)
  return c.json(newPI, 201)
})

// GET /:id - get single payment intent
piRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  const pi = paymentIntents.find((p) => p.id === id)

  if (!pi) {
    return c.json({ error: { message: `No such payment_intent: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(pi)
})

// POST /:id - update payment intent
piRouter.post('/:id', async (c) => {
  const id = c.req.param('id')
  const idx = paymentIntents.findIndex((p) => p.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such payment_intent: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const body = await c.req.json<Partial<PaymentIntent>>()
  const updated: PaymentIntent = { ...paymentIntents[idx], ...body, id, object: 'payment_intent' }
  paymentIntents[idx] = updated

  return c.json(updated)
})

// POST /:id/confirm - confirm payment intent (set status to succeeded)
piRouter.post('/:id/confirm', (c) => {
  const id = c.req.param('id')
  const idx = paymentIntents.findIndex((p) => p.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such payment_intent: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  paymentIntents[idx] = { ...paymentIntents[idx], status: 'succeeded' }
  return c.json(paymentIntents[idx])
})

// POST /:id/cancel - cancel payment intent
piRouter.post('/:id/cancel', (c) => {
  const id = c.req.param('id')
  const idx = paymentIntents.findIndex((p) => p.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such payment_intent: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (paymentIntents[idx].status === 'succeeded') {
    return c.json({ error: { message: 'You cannot cancel this PaymentIntent because it has already succeeded.', type: 'invalid_request_error' } }, 400)
  }

  paymentIntents[idx] = { ...paymentIntents[idx], status: 'canceled' }
  return c.json(paymentIntents[idx])
})

// ─── Charges ──────────────────────────────────────────────────────────────────

const chargeRouter = new Hono()

// GET / - list charges (mapped from payment intents)
chargeRouter.get('/', (c) => {
  const limitParam = c.req.query('limit')
  const customer = c.req.query('customer')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...paymentIntents]

  if (customer) {
    results = results.filter((pi) => pi.customer === customer)
  }

  const charges = results.map(piToCharge)
  return c.json(listResponse(charges, limit))
})

// GET /:id - get single charge (by ch_ id)
chargeRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  // Support both ch_ prefix and pi_ prefix lookups
  const piId = id.startsWith('ch_') ? id.replace('ch_', 'pi_') : id
  const pi = paymentIntents.find((p) => p.id === piId)

  if (!pi) {
    return c.json({ error: { message: `No such charge: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(piToCharge(pi))
})

router.route('/payment_intents', piRouter)
router.route('/charges', chargeRouter)

export default router
