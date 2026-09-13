import { Hono } from 'hono'
import { refunds as seedRefunds, paymentIntents, type Refund } from '../data/seed.js'

const refunds = [...seedRefunds]

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

// GET / - list refunds
router.get('/', (c) => {
  const chargeFilter = c.req.query('charge')
  const paymentIntentFilter = c.req.query('payment_intent')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...refunds]

  if (chargeFilter) {
    results = results.filter((r) => r.charge === chargeFilter)
  }
  if (paymentIntentFilter) {
    results = results.filter((r) => r.payment_intent === paymentIntentFilter)
  }

  results.sort((a, b) => b.created - a.created)

  return c.json(listResponse(results, limit))
})

// POST / - create refund
router.post('/', async (c) => {
  const body = await c.req.json<{
    charge?: string
    payment_intent?: string
    amount?: number
    reason?: string
    metadata?: Record<string, string>
  }>()

  if (!body.charge && !body.payment_intent) {
    return c.json({ error: { message: 'Missing required param: charge or payment_intent', type: 'invalid_request_error' } }, 400)
  }

  // Resolve charge/payment_intent
  let piId: string | null = null
  let chargeId: string | null = null

  if (body.payment_intent) {
    piId = body.payment_intent
    chargeId = piId.replace('pi_', 'ch_')
  } else if (body.charge) {
    chargeId = body.charge
    piId = chargeId.replace('ch_', 'pi_')
  }

  // Validate the payment intent exists and can be refunded
  const pi = paymentIntents.find((p) => p.id === piId)
  if (!pi) {
    return c.json({ error: { message: `No such payment_intent: '${piId}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (pi.status !== 'succeeded') {
    return c.json({ error: { message: 'This charge has not been captured.', type: 'invalid_request_error' } }, 400)
  }

  const refundAmount = body.amount ?? pi.amount

  if (refundAmount > pi.amount) {
    return c.json({ error: { message: 'Refund amount exceeds original charge amount.', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const newRefund: Refund = {
    id: `re_3${generateId()}`,
    object: 'refund',
    charge: chargeId!,
    payment_intent: piId!,
    amount: refundAmount,
    status: 'succeeded',
    reason: body.reason ?? null,
    created: now,
    currency: pi.currency,
    metadata: body.metadata ?? {},
  }

  refunds.unshift(newRefund)
  return c.json(newRefund, 201)
})

// GET /:id - get single refund
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const refund = refunds.find((r) => r.id === id)

  if (!refund) {
    return c.json({ error: { message: `No such refund: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(refund)
})

export default router
