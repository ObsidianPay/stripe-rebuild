import { Hono } from 'hono'
import { balance, balanceTransactions } from '../data/seed.js'

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

// GET / - return balance object
router.get('/', (c) => {
  return c.json(balance)
})

// GET /history - return list of balance transactions
router.get('/history', (c) => {
  const limitParam = c.req.query('limit')
  const typeFilter = c.req.query('type')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  let results = [...balanceTransactions]

  if (typeFilter) {
    results = results.filter((txn) => txn.type === typeFilter)
  }

  // Sort by created descending (most recent first)
  results.sort((a, b) => b.created - a.created)

  return c.json(listResponse(results, limit))
})

export default router
