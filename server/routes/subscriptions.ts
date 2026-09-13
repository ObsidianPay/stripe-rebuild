import { Hono } from 'hono'
import { subscriptions as seedSubscriptions, type Subscription } from '../data/seed.js'

const subscriptions = [...seedSubscriptions]

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

// GET / - list subscriptions
router.get('/', (c) => {
  const customer = c.req.query('customer')
  const status = c.req.query('status')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...subscriptions]

  if (customer) {
    results = results.filter((sub) => sub.customer === customer)
  }
  if (status) {
    results = results.filter((sub) => sub.status === status)
  }

  return c.json(listResponse(results, limit))
})

// POST / - create subscription
router.post('/', async (c) => {
  const body = await c.req.json<Partial<Subscription>>()

  if (!body.customer) {
    return c.json({ error: { message: 'Missing required param: customer', type: 'invalid_request_error' } }, 400)
  }

  if (!body.plan) {
    return c.json({ error: { message: 'Missing required param: plan', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const periodEnd = now + 30 * 24 * 60 * 60 // 30 days from now

  const newSub: Subscription = {
    id: `sub_${generateId()}`,
    object: 'subscription',
    customer: body.customer,
    status: 'active',
    current_period_start: now,
    current_period_end: periodEnd,
    plan: body.plan,
    cancel_at_period_end: body.cancel_at_period_end ?? false,
    canceled_at: null,
    created: now,
    metadata: body.metadata ?? {},
  }

  subscriptions.unshift(newSub)
  return c.json(newSub, 201)
})

// GET /:id - get single subscription
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const sub = subscriptions.find((s) => s.id === id)

  if (!sub) {
    return c.json({ error: { message: `No such subscription: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(sub)
})

// POST /:id - update subscription
router.post('/:id', async (c) => {
  const id = c.req.param('id')
  const idx = subscriptions.findIndex((s) => s.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such subscription: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const body = await c.req.json<Partial<Subscription>>()
  const updated: Subscription = { ...subscriptions[idx], ...body, id, object: 'subscription' }
  subscriptions[idx] = updated

  return c.json(updated)
})

// DELETE /:id - cancel subscription
router.delete('/:id', (c) => {
  const id = c.req.param('id')
  const idx = subscriptions.findIndex((s) => s.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such subscription: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const now = Math.floor(Date.now() / 1000)
  subscriptions[idx] = {
    ...subscriptions[idx],
    status: 'canceled',
    canceled_at: now,
    cancel_at_period_end: false,
  }

  return c.json(subscriptions[idx])
})

// POST /:id/pause - pause subscription
router.post('/:id/pause', (c) => {
  const id = c.req.param('id')
  const idx = subscriptions.findIndex((s) => s.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such subscription: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (subscriptions[idx].status === 'canceled') {
    return c.json({ error: { message: 'Cannot pause a canceled subscription.', type: 'invalid_request_error' } }, 400)
  }

  subscriptions[idx] = { ...subscriptions[idx], status: 'paused' }
  return c.json(subscriptions[idx])
})

// POST /:id/resume - resume subscription
router.post('/:id/resume', (c) => {
  const id = c.req.param('id')
  const idx = subscriptions.findIndex((s) => s.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such subscription: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (subscriptions[idx].status !== 'paused') {
    return c.json({ error: { message: 'Only paused subscriptions can be resumed.', type: 'invalid_request_error' } }, 400)
  }

  subscriptions[idx] = { ...subscriptions[idx], status: 'active' }
  return c.json(subscriptions[idx])
})

export default router
