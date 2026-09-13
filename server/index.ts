import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import customersRouter from './routes/customers.js'
import paymentsRouter from './routes/payments.js'
import subscriptionsRouter from './routes/subscriptions.js'
import invoicesRouter from './routes/invoices.js'
import productsRouter from './routes/products.js'
import paymentLinksRouter from './routes/payment-links.js'
import checkoutRouter from './routes/checkout.js'
import balanceRouter from './routes/balance.js'
import eventsRouter from './routes/events.js'
import refundsRouter from './routes/refunds.js'
import disputesRouter from './routes/disputes.js'

const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Stripe-Version'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}))

app.use('*', logger())

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Stripe-like v1 routes ────────────────────────────────────────────────────
app.route('/v1/customers', customersRouter)
app.route('/v1/subscriptions', subscriptionsRouter)
app.route('/v1/invoices', invoicesRouter)
app.route('/v1/payment_links', paymentLinksRouter)
app.route('/v1/checkout', checkoutRouter)
app.route('/v1/balance', balanceRouter)
app.route('/v1/events', eventsRouter)
app.route('/v1/refunds', refundsRouter)
app.route('/v1/disputes', disputesRouter)

// Payments router exposes /payment_intents and /charges as sub-routes
app.route('/v1', paymentsRouter)

// Products router exposes /products and /prices as sub-routes
app.route('/v1', productsRouter)

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({
    error: {
      message: `Unrecognized request URL (${c.req.method} ${c.req.path}). Please see https://stripe.com/docs or we can help at https://support.stripe.com/.`,
      type: 'invalid_request_error',
    },
  }, 404)
})

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err)
  return c.json({
    error: {
      message: err.message ?? 'An unexpected error occurred.',
      type: 'api_error',
    },
  }, 500)
})

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
  console.log(`API base path: http://localhost:${info.port}/api/v1`)
})
