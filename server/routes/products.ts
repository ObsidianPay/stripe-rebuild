import { Hono } from 'hono'
import { products as seedProducts, type Product, type Price } from '../data/seed.js'

const products = [...seedProducts]

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

// ─── Products ─────────────────────────────────────────────────────────────────

const productRouter = new Hono()

// GET / - list products
productRouter.get('/', (c) => {
  const activeParam = c.req.query('active')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...products]

  if (activeParam !== undefined) {
    const active = activeParam === 'true'
    results = results.filter((p) => p.active === active)
  }

  // Strip prices from the product list by default (Stripe behavior: separate /prices endpoint)
  // but include them here for convenience
  return c.json(listResponse(results, limit))
})

// POST / - create product
productRouter.post('/', async (c) => {
  const body = await c.req.json<Partial<Product>>()

  if (!body.name) {
    return c.json({ error: { message: 'Missing required param: name', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const newProduct: Product = {
    id: `prod_${generateId()}`,
    object: 'product',
    name: body.name,
    description: body.description ?? '',
    active: body.active ?? true,
    created: now,
    metadata: body.metadata ?? {},
    prices: [],
  }

  products.unshift(newProduct)
  return c.json(newProduct, 201)
})

// GET /:id - get single product
productRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  const product = products.find((p) => p.id === id)

  if (!product) {
    return c.json({ error: { message: `No such product: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(product)
})

// POST /:id - update product
productRouter.post('/:id', async (c) => {
  const id = c.req.param('id')
  const idx = products.findIndex((p) => p.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such product: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const body = await c.req.json<Partial<Product>>()
  const updated: Product = { ...products[idx], ...body, id, object: 'product', prices: products[idx].prices }
  products[idx] = updated

  return c.json(updated)
})

// DELETE /:id - archive product
productRouter.delete('/:id', (c) => {
  const id = c.req.param('id')
  const idx = products.findIndex((p) => p.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such product: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  products[idx] = { ...products[idx], active: false }

  return c.json({ id, object: 'product', deleted: true })
})

// ─── Prices ───────────────────────────────────────────────────────────────────

const priceRouter = new Hono()

// GET / - list prices
priceRouter.get('/', (c) => {
  const productId = c.req.query('product')
  const activeParam = c.req.query('active')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let allPrices: Price[] = products.flatMap((p) => p.prices)

  if (productId) {
    allPrices = allPrices.filter((price) => price.product === productId)
  }

  if (activeParam !== undefined) {
    const active = activeParam === 'true'
    allPrices = allPrices.filter((price) => price.active === active)
  }

  return c.json(listResponse(allPrices, limit))
})

// POST / - create price
priceRouter.post('/', async (c) => {
  const body = await c.req.json<Partial<Price>>()

  if (!body.unit_amount || !body.currency || !body.product) {
    return c.json({ error: { message: 'Missing required params: unit_amount, currency, product', type: 'invalid_request_error' } }, 400)
  }

  const productIdx = products.findIndex((p) => p.id === body.product)
  if (productIdx === -1) {
    return c.json({ error: { message: `No such product: '${body.product}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const now = Math.floor(Date.now() / 1000)
  const newPrice: Price = {
    id: `price_${generateId()}`,
    object: 'price',
    unit_amount: body.unit_amount,
    currency: body.currency.toLowerCase(),
    recurring: body.recurring ?? null,
    product: body.product,
    active: body.active ?? true,
    created: now,
  }

  products[productIdx].prices.push(newPrice)
  return c.json(newPrice, 201)
})

// GET /:id - get single price
priceRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  const allPrices: Price[] = products.flatMap((p) => p.prices)
  const price = allPrices.find((p) => p.id === id)

  if (!price) {
    return c.json({ error: { message: `No such price: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(price)
})

// POST /:id - update price
priceRouter.post('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<Price>>()

  let found = false
  for (const product of products) {
    const idx = product.prices.findIndex((p) => p.id === id)
    if (idx !== -1) {
      product.prices[idx] = { ...product.prices[idx], ...body, id, object: 'price', product: product.id }
      found = true
      return c.json(product.prices[idx])
    }
  }

  if (!found) {
    return c.json({ error: { message: `No such price: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }
})

router.route('/products', productRouter)
router.route('/prices', priceRouter)

export default router
