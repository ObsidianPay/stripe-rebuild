import { Hono } from 'hono'
import { subscriptions as seedSubscriptions, type Subscription } from '../data/seed.js'

const subscriptions = [...seedSubscriptions]

const router = new Hono()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Shape the seed's flat `plan` field into the Stripe `items.data` list shape
// so the frontend can always access sub.items.data[0].price
function withItems(sub: Subscription) {
  const plan = sub.plan
  const priceId = plan.id.replace('plan_', 'price_')
  return {
    ...sub,
    items: {
      object: 'list',
      data: [
        {
          id: `si_${sub.id}`,
          object: 'subscription_item',
          quantity: 1,
          price: {
            id: priceId,
            object: 'price',
            unit_amount: plan.amount,
            currency: plan.currency,
            recurring: { interval: plan.interval, interval_count: plan.interval_count },
            product: `prod_${priceId}`,
            active: true,
            created: sub.created,
          },
        },
      ],
      has_more: false,
      total_count: 1,
    },
  }
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

  const shaped = results.map(withItems)
  return c.json(listResponse(shaped, limit))
})

// POST / - create subscription
router.post('/', async (c) => {
  const body = await c.req.json<{
    customer?: string
    items?: Array<{ price: string; quantity?: number }>
    plan?: Subscription['plan']
    trial_end?: number
    cancel_at_period_end?: boolean
    metadata?: Record<string, string>
  }>()

  if (!body.customer) {
    return c.json({ error: { message: 'Missing required param: customer', type: 'invalid_request_error' } }, 400)
  }

  // Accept either the legacy `plan` shape or the modern `items[0].price` shape
  let plan: Subscription['plan']
  if (body.plan) {
    plan = body.plan
  } else if (body.items?.[0]?.price) {
    const priceId = body.items[0].price
    // Map well-known price IDs to plan data; fall back to a generic plan
    const priceMap: Record<string, Subscription['plan']> = {
      price_starter_monthly:  { id: priceId, amount: 4900,   currency: 'usd', interval: 'month', interval_count: 1 },
      price_starter_annual:   { id: priceId, amount: 49000,  currency: 'usd', interval: 'year',  interval_count: 1 },
      price_pro_monthly:      { id: priceId, amount: 9900,   currency: 'usd', interval: 'month', interval_count: 1 },
      price_pro_annual:       { id: priceId, amount: 29900,  currency: 'usd', interval: 'year',  interval_count: 1 },
      price_enterprise_monthly: { id: priceId, amount: 149900, currency: 'usd', interval: 'month', interval_count: 1 },
      price_enterprise_annual:  { id: priceId, amount: 299900, currency: 'usd', interval: 'year',  interval_count: 1 },
    }
    plan = priceMap[priceId] ?? { id: priceId, amount: 0, currency: 'usd', interval: 'month', interval_count: 1 }
  } else {
    return c.json({ error: { message: 'Missing required param: items or plan', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const periodEnd = now + 30 * 24 * 60 * 60

  const newSub: Subscription = {
    id: `sub_${generateId()}`,
    object: 'subscription',
    customer: body.customer,
    status: 'active',
    current_period_start: now,
    current_period_end: periodEnd,
    plan,
    cancel_at_period_end: body.cancel_at_period_end ?? false,
    canceled_at: null,
    created: now,
    metadata: body.metadata ?? {},
  }

  subscriptions.unshift(newSub)
  return c.json(withItems(newSub), 201)
})

// GET /:id - get single subscription
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const sub = subscriptions.find((s) => s.id === id)

  if (!sub) {
    return c.json({ error: { message: `No such subscription: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(withItems(sub))
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

  return c.json(withItems(updated))
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

  return c.json(withItems(subscriptions[idx]))
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
  return c.json(withItems(subscriptions[idx]))
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
  return c.json(withItems(subscriptions[idx]))
})

export default router
