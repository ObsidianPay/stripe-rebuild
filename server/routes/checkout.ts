import { Hono } from 'hono'
import { checkoutSessions, type CheckoutSession } from '../data/seed.js'

const router = new Hono()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// POST /sessions - create checkout session
router.post('/sessions', async (c) => {
  const body = await c.req.json<{
    customer?: string
    amount?: number
    currency?: string
    product?: string
    success_url?: string
    cancel_url?: string
    metadata?: Record<string, string>
  }>()

  const now = Math.floor(Date.now() / 1000)
  const id = `cs_test_${generateId()}`

  const newSession: CheckoutSession = {
    id,
    object: 'checkout.session',
    url: `/checkout/${id}`,
    status: 'open',
    customer: body.customer ?? null,
    payment_intent: null,
    amount_total: body.amount ?? null,
    currency: body.currency?.toLowerCase() ?? 'usd',
    created: now,
    metadata: body.metadata ?? {},
  }

  checkoutSessions.push(newSession)
  return c.json(newSession, 201)
})

// GET /sessions/:id - get a checkout session
router.get('/sessions/:id', (c) => {
  const id = c.req.param('id')
  const session = checkoutSessions.find((s) => s.id === id)

  if (!session) {
    return c.json({ error: { message: `No such checkout session: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(session)
})

// GET /:id - serve checkout page info (for frontend rendering)
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const session = checkoutSessions.find((s) => s.id === id)

  if (!session) {
    return c.json({ error: { message: `No such checkout session: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (session.status === 'expired') {
    return c.json({ error: { message: 'This checkout session has expired.', type: 'invalid_request_error', code: 'session_expired' } }, 410)
  }

  // Return the session enriched with checkout page-specific data
  return c.json({
    ...session,
    page: {
      title: 'Complete your purchase',
      submit_label: 'Pay now',
      locale: 'en',
      billing_address_collection: 'auto',
      payment_method_types: ['card'],
    },
  })
})

export default router
