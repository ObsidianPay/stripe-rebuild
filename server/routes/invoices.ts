import { Hono } from 'hono'
import { invoices as seedInvoices, type Invoice } from '../data/seed.js'

const invoices = [...seedInvoices]

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

// GET / - list invoices
router.get('/', (c) => {
  const customer = c.req.query('customer')
  const status = c.req.query('status')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...invoices]

  if (customer) {
    results = results.filter((inv) => inv.customer === customer)
  }
  if (status) {
    results = results.filter((inv) => inv.status === status)
  }

  return c.json(listResponse(results, limit))
})

// POST / - create invoice
router.post('/', async (c) => {
  const body = await c.req.json<Partial<Invoice>>()

  if (!body.customer) {
    return c.json({ error: { message: 'Missing required param: customer', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const newInvoice: Invoice = {
    id: `in_1${generateId()}`,
    object: 'invoice',
    customer: body.customer,
    status: 'draft',
    amount_due: body.amount_due ?? 0,
    amount_paid: 0,
    due_date: body.due_date ?? null,
    created: now,
    description: body.description ?? '',
    currency: body.currency ?? 'usd',
    sent: false,
    metadata: body.metadata ?? {},
  }

  invoices.unshift(newInvoice)
  return c.json(newInvoice, 201)
})

// GET /:id - get single invoice
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const invoice = invoices.find((inv) => inv.id === id)

  if (!invoice) {
    return c.json({ error: { message: `No such invoice: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(invoice)
})

// POST /:id - update invoice
router.post('/:id', async (c) => {
  const id = c.req.param('id')
  const idx = invoices.findIndex((inv) => inv.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such invoice: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const body = await c.req.json<Partial<Invoice>>()
  const updated: Invoice = { ...invoices[idx], ...body, id, object: 'invoice' }
  invoices[idx] = updated

  return c.json(updated)
})

// POST /:id/finalize - finalize invoice (draft -> open)
router.post('/:id/finalize', (c) => {
  const id = c.req.param('id')
  const idx = invoices.findIndex((inv) => inv.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such invoice: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (invoices[idx].status !== 'draft') {
    return c.json({ error: { message: 'Only draft invoices can be finalized.', type: 'invalid_request_error' } }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  invoices[idx] = {
    ...invoices[idx],
    status: 'open',
    due_date: invoices[idx].due_date ?? now + 30 * 24 * 60 * 60,
  }

  return c.json(invoices[idx])
})

// POST /:id/pay - pay invoice (open -> paid)
router.post('/:id/pay', (c) => {
  const id = c.req.param('id')
  const idx = invoices.findIndex((inv) => inv.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such invoice: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (invoices[idx].status !== 'open') {
    return c.json({ error: { message: 'Only open invoices can be paid.', type: 'invalid_request_error' } }, 400)
  }

  invoices[idx] = {
    ...invoices[idx],
    status: 'paid',
    amount_paid: invoices[idx].amount_due,
  }

  return c.json(invoices[idx])
})

// POST /:id/void - void invoice
router.post('/:id/void', (c) => {
  const id = c.req.param('id')
  const idx = invoices.findIndex((inv) => inv.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such invoice: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (invoices[idx].status === 'paid') {
    return c.json({ error: { message: 'Paid invoices cannot be voided.', type: 'invalid_request_error' } }, 400)
  }

  if (invoices[idx].status === 'void') {
    return c.json({ error: { message: 'This invoice has already been voided.', type: 'invalid_request_error' } }, 400)
  }

  invoices[idx] = { ...invoices[idx], status: 'void' }
  return c.json(invoices[idx])
})

// POST /:id/send - mark invoice as sent
router.post('/:id/send', (c) => {
  const id = c.req.param('id')
  const idx = invoices.findIndex((inv) => inv.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such invoice: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  if (invoices[idx].status === 'draft') {
    return c.json({ error: { message: 'Finalize the invoice before sending.', type: 'invalid_request_error' } }, 400)
  }

  invoices[idx] = { ...invoices[idx], sent: true }
  return c.json(invoices[idx])
})

export default router
