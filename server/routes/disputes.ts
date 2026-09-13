import { Hono } from 'hono'
import { disputes as seedDisputes } from '../data/seed.js'

const disputes = [...seedDisputes]

const router = new Hono()

function listResponse<T>(data: T[], limit?: number) {
  const sliced = limit ? data.slice(0, limit) : data
  return {
    object: 'list',
    data: sliced,
    has_more: limit ? data.length > limit : false,
    total_count: data.length,
  }
}

// GET / - list disputes
router.get('/', (c) => {
  const chargeFilter = c.req.query('charge')
  const statusFilter = c.req.query('status')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...disputes]

  if (chargeFilter) {
    results = results.filter((d) => d.charge === chargeFilter)
  }
  if (statusFilter) {
    results = results.filter((d) => d.status === statusFilter)
  }

  results.sort((a, b) => b.created - a.created)

  return c.json(listResponse(results, limit))
})

// GET /:id - get single dispute
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const dispute = disputes.find((d) => d.id === id)

  if (!dispute) {
    return c.json({ error: { message: `No such dispute: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(dispute)
})

// POST /:id/close - close a dispute
router.post('/:id/close', (c) => {
  const id = c.req.param('id')
  const idx = disputes.findIndex((d) => d.id === id)

  if (idx === -1) {
    return c.json({ error: { message: `No such dispute: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  const closeable = ['warning_needs_response', 'warning_under_review', 'needs_response', 'under_review']
  if (!closeable.includes(disputes[idx].status)) {
    return c.json({ error: { message: `Dispute with status '${disputes[idx].status}' cannot be closed.`, type: 'invalid_request_error' } }, 400)
  }

  disputes[idx] = { ...disputes[idx], status: 'lost' }
  return c.json(disputes[idx])
})

export default router
