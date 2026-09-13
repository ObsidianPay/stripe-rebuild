import { Hono } from 'hono'
import { paymentLinks as seedPaymentLinks, type PaymentLink } from '../data/seed.js'

const paymentLinks = [...seedPaymentLinks]

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

// GET / - list payment links
router.get('/', (c) => {
  const activeParam = c.req.query('active')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...paymentLinks]

  if (activeParam !== undefined) {
    const active = activeParam === 'true'
    results = results.filter((pl) => pl.active === active)
  }

  return c.json(listResponse(results, limit))
})

// POST / - create payment link
router.post('/', async (c) => {
  const body = await c.req.json<Partial<PaymentLink>>()

  if (!body.amount || !body.currency || !body.product) {
    return c.json({ error: { message: 'Missing required params: amount, currency, product', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const id = `plink_${generateId()}`
  const newLink: PaymentLink = {
    id,
    object: 'payment_link',
    active: body.active ?? true,
    url: `https://buy.stripe.com/test_${id}`,
    amount: body.amount,
    currency: body.currency.toLowerCase(),
    created: now,
    product: body.product,
    metadata: body.metadata ?? {},
  }

  paymentLinks.unshift(newLink)
  return c.json(newLink, 201)
})

// GET /:id - get single payment link
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const link = paymentLinks.find((pl) => pl.id === id)

  if (!link) {
    return c.json({ error: { message: `No such payment_link: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(link)
})

// POST /:id - update payment link (activate/deactivate or other fields)
router.post('/:id', async (c) => {
  const id = c.req.param('id')
  const idx = paymentLinks.findIndex((pl) => pl.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such payment_link: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const body = await c.req.json<Partial<PaymentLink>>()
  const updated: PaymentLink = {
    ...paymentLinks[idx],
    ...body,
    id,
    object: 'payment_link',
    url: paymentLinks[idx].url,
    created: paymentLinks[idx].created,
  }
  paymentLinks[idx] = updated

  return c.json(updated)
})

export default router
