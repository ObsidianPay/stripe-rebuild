import { Hono } from 'hono'
import { events } from '../data/seed.js'

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

// GET / - list events
router.get('/', (c) => {
  const limitParam = c.req.query('limit')
  const typeFilter = c.req.query('type')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...events]

  if (typeFilter) {
    results = results.filter((evt) => evt.type === typeFilter || evt.type.startsWith(typeFilter))
  }

  // Sort by created descending (most recent first)
  results.sort((a, b) => b.created - a.created)

  return c.json(listResponse(results, limit))
})

// GET /:id - get single event
router.get('/:id', (c) => {
  const id = c.req.param('id')
  const event = events.find((evt) => evt.id === id)

  if (!event) {
    return c.json({ error: { message: `No such event: '${id}'`, type: 'invalid_request_error', code: 'resource_missing' } }, 404)
  }

  return c.json(event)
})

export default router
