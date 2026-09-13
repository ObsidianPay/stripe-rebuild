// Stripe-like stub data for in-memory store

export type Address = {
  line1: string
  line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
}

export type Customer = {
  id: string
  object: 'customer'
  name: string
  email: string
  phone: string
  created: number
  balance: number
  currency: string
  description: string
  metadata: Record<string, string>
  address: Address
  delinquent: boolean
}

export type PaymentIntent = {
  id: string
  object: 'payment_intent'
  amount: number
  currency: string
  status: 'succeeded' | 'requires_payment_method' | 'processing' | 'canceled' | 'requires_action' | 'requires_confirmation'
  customer: string
  description: string
  created: number
  payment_method: string
  receipt_email: string | null
  metadata: Record<string, string>
}

export type Plan = {
  id: string
  amount: number
  currency: string
  interval: 'month' | 'year' | 'week' | 'day'
  interval_count: number
}

export type Subscription = {
  id: string
  object: 'subscription'
  customer: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused' | 'incomplete'
  current_period_start: number
  current_period_end: number
  plan: Plan
  cancel_at_period_end: boolean
  canceled_at: number | null
  created: number
  metadata: Record<string, string>
}

export type Invoice = {
  id: string
  object: 'invoice'
  customer: string
  status: 'paid' | 'open' | 'draft' | 'void' | 'uncollectible'
  amount_due: number
  amount_paid: number
  due_date: number | null
  created: number
  description: string
  currency: string
  sent: boolean
  metadata: Record<string, string>
}

export type Price = {
  id: string
  object: 'price'
  unit_amount: number
  currency: string
  recurring: { interval: 'month' | 'year' | 'week' | 'day'; interval_count: number } | null
  product: string
  active: boolean
  created: number
}

export type Product = {
  id: string
  object: 'product'
  name: string
  description: string
  active: boolean
  created: number
  metadata: Record<string, string>
  prices: Price[]
}

export type PaymentLink = {
  id: string
  object: 'payment_link'
  active: boolean
  url: string
  amount: number
  currency: string
  created: number
  product: string
  metadata: Record<string, string>
}

export type Balance = {
  object: 'balance'
  available: Array<{ amount: number; currency: string }>
  pending: Array<{ amount: number; currency: string }>
  connect_reserved: Array<{ amount: number; currency: string }>
}

export type Event = {
  id: string
  object: 'event'
  type: string
  created: number
  data: { object: Record<string, unknown> }
  livemode: boolean
  api_version: string
}

export type Refund = {
  id: string
  object: 'refund'
  charge: string
  payment_intent: string
  amount: number
  status: 'succeeded' | 'pending' | 'failed' | 'canceled'
  reason: string | null
  created: number
  currency: string
  metadata: Record<string, string>
}

export type Dispute = {
  id: string
  object: 'dispute'
  charge: string
  payment_intent: string
  amount: number
  status: 'needs_response' | 'under_review' | 'won' | 'lost' | 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'closed'
  reason: string
  created: number
  currency: string
  evidence_details: { due_by: number; has_evidence: boolean; past_due: boolean; submission_count: number }
}

export type CheckoutSession = {
  id: string
  object: 'checkout.session'
  url: string
  status: 'open' | 'complete' | 'expired'
  customer: string | null
  payment_intent: string | null
  amount_total: number | null
  currency: string | null
  created: number
  metadata: Record<string, string>
}

// ─── Serializers (Stripe response shapes) ─────────────────────────────────────

export function withItems(sub: Subscription) {
  const { plan } = sub
  const priceId = plan.id.replace(/^plan_/, 'price_')
  return {
    ...sub,
    items: {
      object: 'list',
      data: [
        {
          id: `si_${sub.id.replace(/^sub_/, '')}`,
          object: 'subscription_item',
          quantity: 1,
          price: {
            id: priceId,
            object: 'price',
            unit_amount: plan.amount,
            currency: plan.currency,
            recurring: { interval: plan.interval, interval_count: plan.interval_count },
            product: products.find((p) => p.prices.some((pr) => pr.id === priceId))?.id ?? null,
            nickname: sub.metadata.plan_name ?? null,
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

export function withAmountReceived(pi: PaymentIntent) {
  return { ...pi, amount_received: pi.status === 'succeeded' ? pi.amount : 0 }
}

// ─── Customers ────────────────────────────────────────────────────────────────

export const customers: Customer[] = [
  {
    id: 'cus_QpR2mN8xZ1aB',
    object: 'customer',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1-555-234-5678',
    created: 1700000000,
    balance: 0,
    currency: 'usd',
    description: 'Enterprise plan customer from the west coast',
    metadata: { tier: 'enterprise', account_manager: 'sarah' },
    address: { line1: '123 Market St', line2: 'Suite 400', city: 'San Francisco', state: 'CA', postal_code: '94105', country: 'US' },
    delinquent: false,
  },
  {
    id: 'cus_Lk7vW3yT9cD2',
    object: 'customer',
    name: 'Bob Martinez',
    email: 'bob.martinez@techcorp.io',
    phone: '+1-555-345-6789',
    created: 1701000000,
    balance: -2000,
    currency: 'usd',
    description: 'Monthly subscriber, small business owner',
    metadata: { tier: 'starter', referral: 'google' },
    address: { line1: '456 Oak Ave', line2: null, city: 'Austin', state: 'TX', postal_code: '73301', country: 'US' },
    delinquent: false,
  },
  {
    id: 'cus_Mn4jH6sU0eF3',
    object: 'customer',
    name: 'Carol White',
    email: 'carol.white@designstudio.co',
    phone: '+1-555-456-7890',
    created: 1702000000,
    balance: 5000,
    currency: 'usd',
    description: 'Freelance designer, occasional purchases',
    metadata: { tier: 'pro', industry: 'design' },
    address: { line1: '789 Pine Rd', line2: 'Apt 12', city: 'Brooklyn', state: 'NY', postal_code: '11201', country: 'US' },
    delinquent: false,
  },
  {
    id: 'cus_Op8kI7rV1gH4',
    object: 'customer',
    name: 'David Kim',
    email: 'david.kim@startup.dev',
    phone: '+1-555-567-8901',
    created: 1703000000,
    balance: 0,
    currency: 'usd',
    description: 'YC-backed startup founder',
    metadata: { tier: 'growth', company_size: '10-50' },
    address: { line1: '321 Elm Blvd', line2: null, city: 'Seattle', state: 'WA', postal_code: '98101', country: 'US' },
    delinquent: false,
  },
  {
    id: 'cus_Rq9lJ8sW2hI5',
    object: 'customer',
    name: 'Emma Davis',
    email: 'emma.davis@nonprofit.org',
    phone: '+1-555-678-9012',
    created: 1704000000,
    balance: 0,
    currency: 'usd',
    description: 'Non-profit organization account',
    metadata: { tier: 'nonprofit', tax_exempt: 'true' },
    address: { line1: '654 Maple Dr', line2: 'Floor 2', city: 'Chicago', state: 'IL', postal_code: '60601', country: 'US' },
    delinquent: false,
  },
  {
    id: 'cus_St0mK9tX3jJ6',
    object: 'customer',
    name: 'Frank Thompson',
    email: 'frank.thompson@retailco.com',
    phone: '+1-555-789-0123',
    created: 1705000000,
    balance: -10000,
    currency: 'usd',
    description: 'Retail company, high volume transactions',
    metadata: { tier: 'enterprise', industry: 'retail' },
    address: { line1: '987 Cedar Ln', line2: null, city: 'Miami', state: 'FL', postal_code: '33101', country: 'US' },
    delinquent: true,
  },
  {
    id: 'cus_Uv1nL0uY4kK7',
    object: 'customer',
    name: 'Grace Lee',
    email: 'grace.lee@medtech.health',
    phone: '+1-555-890-1234',
    created: 1706000000,
    balance: 0,
    currency: 'usd',
    description: 'Healthcare technology company',
    metadata: { tier: 'pro', industry: 'healthcare', hipaa_baa: 'signed' },
    address: { line1: '246 Birch Way', line2: 'Suite 100', city: 'Boston', state: 'MA', postal_code: '02101', country: 'US' },
    delinquent: false,
  },
  {
    id: 'cus_Wx2oM1vZ5lL8',
    object: 'customer',
    name: 'Henry Chen',
    email: 'henry.chen@globalimports.biz',
    phone: '+1-555-901-2345',
    created: 1707000000,
    balance: 25000,
    currency: 'usd',
    description: 'International import/export business',
    metadata: { tier: 'enterprise', region: 'apac' },
    address: { line1: '135 Walnut St', line2: null, city: 'Los Angeles', state: 'CA', postal_code: '90001', country: 'US' },
    delinquent: false,
  },
]

// ─── Payment Intents ───────────────────────────────────────────────────────────

export const paymentIntents: PaymentIntent[] = [
  {
    id: 'pi_3QpR2mN8xZ1aBcD',
    object: 'payment_intent',
    amount: 9900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_QpR2mN8xZ1aB',
    description: 'Subscription payment - Pro Plan',
    created: 1709000000,
    payment_method: 'pm_1QpR2mN8xZ1aBcD',
    receipt_email: 'alice.johnson@example.com',
    metadata: { plan: 'pro' },
  },
  {
    id: 'pi_3Lk7vW3yT9cD2eF',
    object: 'payment_intent',
    amount: 4900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Lk7vW3yT9cD2',
    description: 'One-time purchase - Starter Kit',
    created: 1709100000,
    payment_method: 'pm_1Lk7vW3yT9cD2eF',
    receipt_email: 'bob.martinez@techcorp.io',
    metadata: {},
  },
  {
    id: 'pi_3Mn4jH6sU0eF3gH',
    object: 'payment_intent',
    amount: 29900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Mn4jH6sU0eF3',
    description: 'Annual subscription - Pro Plan',
    created: 1709200000,
    payment_method: 'pm_1Mn4jH6sU0eF3gH',
    receipt_email: 'carol.white@designstudio.co',
    metadata: { plan: 'pro_annual' },
  },
  {
    id: 'pi_3Op8kI7rV1gH4iJ',
    object: 'payment_intent',
    amount: 19900,
    currency: 'usd',
    status: 'requires_payment_method',
    customer: 'cus_Op8kI7rV1gH4',
    description: 'Growth plan upgrade',
    created: 1709300000,
    payment_method: 'pm_1Op8kI7rV1gH4iJ',
    receipt_email: 'david.kim@startup.dev',
    metadata: { plan: 'growth' },
  },
  {
    id: 'pi_3Rq9lJ8sW2hI5jK',
    object: 'payment_intent',
    amount: 5000,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Rq9lJ8sW2hI5',
    description: 'Donation - Annual campaign',
    created: 1709400000,
    payment_method: 'pm_1Rq9lJ8sW2hI5jK',
    receipt_email: 'emma.davis@nonprofit.org',
    metadata: { campaign: '2024_annual' },
  },
  {
    id: 'pi_3St0mK9tX3jJ6kL',
    object: 'payment_intent',
    amount: 149900,
    currency: 'usd',
    status: 'processing',
    customer: 'cus_St0mK9tX3jJ6',
    description: 'Enterprise license Q1',
    created: 1709500000,
    payment_method: 'pm_1St0mK9tX3jJ6kL',
    receipt_email: 'frank.thompson@retailco.com',
    metadata: { quarter: 'Q1_2024' },
  },
  {
    id: 'pi_3Uv1nL0uY4kK7lM',
    object: 'payment_intent',
    amount: 59900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Uv1nL0uY4kK7',
    description: 'Healthcare Pro subscription',
    created: 1709600000,
    payment_method: 'pm_1Uv1nL0uY4kK7lM',
    receipt_email: 'grace.lee@medtech.health',
    metadata: { plan: 'healthcare_pro' },
  },
  {
    id: 'pi_3Wx2oM1vZ5lL8mN',
    object: 'payment_intent',
    amount: 299900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Wx2oM1vZ5lL8',
    description: 'Enterprise annual license',
    created: 1709700000,
    payment_method: 'pm_1Wx2oM1vZ5lL8mN',
    receipt_email: 'henry.chen@globalimports.biz',
    metadata: { plan: 'enterprise_annual' },
  },
  {
    id: 'pi_3QpR2mN8xZ1aBnO',
    object: 'payment_intent',
    amount: 9900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_QpR2mN8xZ1aB',
    description: 'Subscription renewal - Pro Plan',
    created: 1710000000,
    payment_method: 'pm_1QpR2mN8xZ1aBcD',
    receipt_email: 'alice.johnson@example.com',
    metadata: { plan: 'pro', renewal: 'true' },
  },
  {
    id: 'pi_3Lk7vW3yT9cD2oP',
    object: 'payment_intent',
    amount: 2500,
    currency: 'usd',
    status: 'requires_payment_method',
    customer: 'cus_Lk7vW3yT9cD2',
    description: 'Add-on feature purchase',
    created: 1710100000,
    payment_method: 'pm_1Lk7vW3yT9cD2eF',
    receipt_email: 'bob.martinez@techcorp.io',
    metadata: { feature: 'advanced_analytics' },
  },
  {
    id: 'pi_3Mn4jH6sU0eF3pQ',
    object: 'payment_intent',
    amount: 14900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Mn4jH6sU0eF3',
    description: 'Design toolkit license',
    created: 1710200000,
    payment_method: 'pm_1Mn4jH6sU0eF3gH',
    receipt_email: 'carol.white@designstudio.co',
    metadata: { product: 'design_toolkit' },
  },
  {
    id: 'pi_3Op8kI7rV1gH4qR',
    object: 'payment_intent',
    amount: 9900,
    currency: 'usd',
    status: 'processing',
    customer: 'cus_Op8kI7rV1gH4',
    description: 'Monthly plan payment',
    created: 1710300000,
    payment_method: 'pm_1Op8kI7rV1gH4iJ',
    receipt_email: 'david.kim@startup.dev',
    metadata: {},
  },
  {
    id: 'pi_3Rq9lJ8sW2hI5rS',
    object: 'payment_intent',
    amount: 25000,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Rq9lJ8sW2hI5',
    description: 'Fundraising event tickets',
    created: 1710400000,
    payment_method: 'pm_1Rq9lJ8sW2hI5jK',
    receipt_email: 'emma.davis@nonprofit.org',
    metadata: { event: 'gala_2024' },
  },
  {
    id: 'pi_3Uv1nL0uY4kK7sT',
    object: 'payment_intent',
    amount: 79900,
    currency: 'usd',
    status: 'succeeded',
    customer: 'cus_Uv1nL0uY4kK7',
    description: 'Compliance module add-on',
    created: 1710500000,
    payment_method: 'pm_1Uv1nL0uY4kK7lM',
    receipt_email: 'grace.lee@medtech.health',
    metadata: { module: 'hipaa_compliance' },
  },
  {
    id: 'pi_3Wx2oM1vZ5lL8tU',
    object: 'payment_intent',
    amount: 49900,
    currency: 'usd',
    status: 'requires_payment_method',
    customer: 'cus_Wx2oM1vZ5lL8',
    description: 'Additional seat licenses x5',
    created: 1710600000,
    payment_method: 'pm_1Wx2oM1vZ5lL8mN',
    receipt_email: 'henry.chen@globalimports.biz',
    metadata: { seats: '5' },
  },
]

// ─── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptions: Subscription[] = [
  {
    id: 'sub_QpR2mN8xZ1aBcD',
    object: 'subscription',
    customer: 'cus_QpR2mN8xZ1aB',
    status: 'active',
    current_period_start: 1709000000,
    current_period_end: 1711678400,
    plan: { id: 'plan_pro_monthly', amount: 9900, currency: 'usd', interval: 'month', interval_count: 1 },
    cancel_at_period_end: false,
    canceled_at: null,
    created: 1700000000,
    metadata: { plan_name: 'Pro Monthly' },
  },
  {
    id: 'sub_Lk7vW3yT9cD2eF',
    object: 'subscription',
    customer: 'cus_Lk7vW3yT9cD2',
    status: 'active',
    current_period_start: 1709100000,
    current_period_end: 1711778400,
    plan: { id: 'plan_starter_monthly', amount: 4900, currency: 'usd', interval: 'month', interval_count: 1 },
    cancel_at_period_end: false,
    canceled_at: null,
    created: 1701000000,
    metadata: { plan_name: 'Starter Monthly' },
  },
  {
    id: 'sub_Mn4jH6sU0eF3gH',
    object: 'subscription',
    customer: 'cus_Mn4jH6sU0eF3',
    status: 'active',
    current_period_start: 1680000000,
    current_period_end: 1711590400,
    plan: { id: 'plan_pro_annual', amount: 29900, currency: 'usd', interval: 'year', interval_count: 1 },
    cancel_at_period_end: true,
    canceled_at: null,
    created: 1680000000,
    metadata: { plan_name: 'Pro Annual' },
  },
  {
    id: 'sub_St0mK9tX3jJ6kL',
    object: 'subscription',
    customer: 'cus_St0mK9tX3jJ6',
    status: 'past_due',
    current_period_start: 1706800000,
    current_period_end: 1709478400,
    plan: { id: 'plan_enterprise_monthly', amount: 149900, currency: 'usd', interval: 'month', interval_count: 1 },
    cancel_at_period_end: false,
    canceled_at: null,
    created: 1705000000,
    metadata: { plan_name: 'Enterprise Monthly' },
  },
  {
    id: 'sub_Uv1nL0uY4kK7lM',
    object: 'subscription',
    customer: 'cus_Uv1nL0uY4kK7',
    status: 'active',
    current_period_start: 1709600000,
    current_period_end: 1712274400,
    plan: { id: 'plan_healthcare_pro', amount: 59900, currency: 'usd', interval: 'month', interval_count: 1 },
    cancel_at_period_end: false,
    canceled_at: null,
    created: 1706000000,
    metadata: { plan_name: 'Healthcare Pro' },
  },
]

// ─── Invoices ──────────────────────────────────────────────────────────────────

export const invoices: Invoice[] = [
  {
    id: 'in_1QpR2mN8xZ1aBcD',
    object: 'invoice',
    customer: 'cus_QpR2mN8xZ1aB',
    status: 'paid',
    amount_due: 9900,
    amount_paid: 9900,
    due_date: 1709604000,
    created: 1709000000,
    description: 'Pro Plan - February 2024',
    currency: 'usd',
    sent: true,
    metadata: {},
  },
  {
    id: 'in_1Lk7vW3yT9cD2eF',
    object: 'invoice',
    customer: 'cus_Lk7vW3yT9cD2',
    status: 'paid',
    amount_due: 4900,
    amount_paid: 4900,
    due_date: 1709704000,
    created: 1709100000,
    description: 'Starter Plan - February 2024',
    currency: 'usd',
    sent: true,
    metadata: {},
  },
  {
    id: 'in_1Mn4jH6sU0eF3gH',
    object: 'invoice',
    customer: 'cus_Mn4jH6sU0eF3',
    status: 'paid',
    amount_due: 29900,
    amount_paid: 29900,
    due_date: 1680604000,
    created: 1680000000,
    description: 'Pro Annual Plan - 2023',
    currency: 'usd',
    sent: true,
    metadata: {},
  },
  {
    id: 'in_1Op8kI7rV1gH4iJ',
    object: 'invoice',
    customer: 'cus_Op8kI7rV1gH4',
    status: 'open',
    amount_due: 19900,
    amount_paid: 0,
    due_date: 1711000000,
    created: 1709300000,
    description: 'Growth Plan - March 2024',
    currency: 'usd',
    sent: true,
    metadata: {},
  },
  {
    id: 'in_1Rq9lJ8sW2hI5jK',
    object: 'invoice',
    customer: 'cus_Rq9lJ8sW2hI5',
    status: 'draft',
    amount_due: 5000,
    amount_paid: 0,
    due_date: null,
    created: 1709400000,
    description: 'Annual Donation Receipt 2024',
    currency: 'usd',
    sent: false,
    metadata: {},
  },
  {
    id: 'in_1St0mK9tX3jJ6kL',
    object: 'invoice',
    customer: 'cus_St0mK9tX3jJ6',
    status: 'open',
    amount_due: 149900,
    amount_paid: 0,
    due_date: 1709800000,
    created: 1709500000,
    description: 'Enterprise Plan - February 2024',
    currency: 'usd',
    sent: true,
    metadata: { escalated: 'true' },
  },
  {
    id: 'in_1Uv1nL0uY4kK7lM',
    object: 'invoice',
    customer: 'cus_Uv1nL0uY4kK7',
    status: 'paid',
    amount_due: 59900,
    amount_paid: 59900,
    due_date: 1710200000,
    created: 1709600000,
    description: 'Healthcare Pro - February 2024',
    currency: 'usd',
    sent: true,
    metadata: {},
  },
  {
    id: 'in_1Wx2oM1vZ5lL8mN',
    object: 'invoice',
    customer: 'cus_Wx2oM1vZ5lL8',
    status: 'paid',
    amount_due: 299900,
    amount_paid: 299900,
    due_date: 1710300000,
    created: 1709700000,
    description: 'Enterprise Annual License 2024',
    currency: 'usd',
    sent: true,
    metadata: { contract_ref: 'ENT-2024-0012' },
  },
]

// ─── Products ─────────────────────────────────────────────────────────────────

export const products: Product[] = [
  {
    id: 'prod_QpR2mN8xStarter',
    object: 'product',
    name: 'Starter Plan',
    description: 'Perfect for individuals and small projects. Up to 3 seats, 10GB storage, email support.',
    active: true,
    created: 1690000000,
    metadata: { category: 'subscription' },
    prices: [
      {
        id: 'price_starter_monthly',
        object: 'price',
        unit_amount: 4900,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        product: 'prod_QpR2mN8xStarter',
        active: true,
        created: 1690000000,
      },
      {
        id: 'price_starter_annual',
        object: 'price',
        unit_amount: 49000,
        currency: 'usd',
        recurring: { interval: 'year', interval_count: 1 },
        product: 'prod_QpR2mN8xStarter',
        active: true,
        created: 1690000000,
      },
    ],
  },
  {
    id: 'prod_Lk7vW3yTProPlan',
    object: 'product',
    name: 'Pro Plan',
    description: 'For growing teams. Unlimited seats, 100GB storage, priority support, advanced analytics.',
    active: true,
    created: 1690100000,
    metadata: { category: 'subscription', popular: 'true' },
    prices: [
      {
        id: 'price_pro_monthly',
        object: 'price',
        unit_amount: 9900,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        product: 'prod_Lk7vW3yTProPlan',
        active: true,
        created: 1690100000,
      },
      {
        id: 'price_pro_annual',
        object: 'price',
        unit_amount: 29900,
        currency: 'usd',
        recurring: { interval: 'year', interval_count: 1 },
        product: 'prod_Lk7vW3yTProPlan',
        active: true,
        created: 1690100000,
      },
    ],
  },
  {
    id: 'prod_Mn4jH6sUEnterprise',
    object: 'product',
    name: 'Enterprise Plan',
    description: 'For large organizations. Custom seats, unlimited storage, dedicated support, SSO, SLA.',
    active: true,
    created: 1690200000,
    metadata: { category: 'subscription', sales_led: 'true' },
    prices: [
      {
        id: 'price_enterprise_monthly',
        object: 'price',
        unit_amount: 149900,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        product: 'prod_Mn4jH6sUEnterprise',
        active: true,
        created: 1690200000,
      },
      {
        id: 'price_enterprise_annual',
        object: 'price',
        unit_amount: 299900,
        currency: 'usd',
        recurring: { interval: 'year', interval_count: 1 },
        product: 'prod_Mn4jH6sUEnterprise',
        active: true,
        created: 1690200000,
      },
    ],
  },
  {
    id: 'prod_Op8kI7rVDesignKit',
    object: 'product',
    name: 'Design Toolkit',
    description: 'One-time purchase. Professional design assets, templates, and component library.',
    active: true,
    created: 1690300000,
    metadata: { category: 'one_time', type: 'digital_asset' },
    prices: [
      {
        id: 'price_design_toolkit_onetime',
        object: 'price',
        unit_amount: 14900,
        currency: 'usd',
        recurring: null,
        product: 'prod_Op8kI7rVDesignKit',
        active: true,
        created: 1690300000,
      },
    ],
  },
  {
    id: 'prod_Rq9lJ8sWHealthcare',
    object: 'product',
    name: 'Healthcare Pro',
    description: 'HIPAA-compliant plan for healthcare organizations. Includes BAA, audit logs, compliance module.',
    active: true,
    created: 1690400000,
    metadata: { category: 'subscription', compliance: 'hipaa' },
    prices: [
      {
        id: 'price_healthcare_pro_monthly',
        object: 'price',
        unit_amount: 59900,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        product: 'prod_Rq9lJ8sWHealthcare',
        active: true,
        created: 1690400000,
      },
      {
        id: 'price_healthcare_pro_annual',
        object: 'price',
        unit_amount: 79900,
        currency: 'usd',
        recurring: { interval: 'year', interval_count: 1 },
        product: 'prod_Rq9lJ8sWHealthcare',
        active: true,
        created: 1690400000,
      },
    ],
  },
]

// ─── Payment Links ─────────────────────────────────────────────────────────────

export const paymentLinks: PaymentLink[] = [
  {
    id: 'plink_QpR2mN8xZ1aBcD',
    object: 'payment_link',
    active: true,
    url: 'https://buy.stripe.com/test_plink_QpR2mN8xZ1aBcD',
    amount: 9900,
    currency: 'usd',
    created: 1700000000,
    product: 'prod_Lk7vW3yTProPlan',
    metadata: { campaign: 'homepage' },
  },
  {
    id: 'plink_Lk7vW3yT9cD2eF',
    object: 'payment_link',
    active: true,
    url: 'https://buy.stripe.com/test_plink_Lk7vW3yT9cD2eF',
    amount: 4900,
    currency: 'usd',
    created: 1701000000,
    product: 'prod_QpR2mN8xStarter',
    metadata: { campaign: 'email_blast' },
  },
  {
    id: 'plink_Mn4jH6sU0eF3gH',
    object: 'payment_link',
    active: false,
    url: 'https://buy.stripe.com/test_plink_Mn4jH6sU0eF3gH',
    amount: 14900,
    currency: 'usd',
    created: 1702000000,
    product: 'prod_Op8kI7rVDesignKit',
    metadata: { campaign: 'product_launch' },
  },
]

// ─── Balance ──────────────────────────────────────────────────────────────────

export const balance: Balance = {
  object: 'balance',
  available: [
    { amount: 2483500, currency: 'usd' },
    { amount: 84200, currency: 'eur' },
  ],
  pending: [
    { amount: 349900, currency: 'usd' },
    { amount: 12000, currency: 'eur' },
  ],
  connect_reserved: [
    { amount: 0, currency: 'usd' },
  ],
}

export const balanceTransactions = [
  { id: 'txn_QpR2mN8xZ1aB', object: 'balance_transaction', amount: 9900, currency: 'usd', net: 9571, fee: 329, type: 'charge', status: 'available', created: 1709000000, description: 'Charge for alice.johnson@example.com', source: 'ch_3QpR2mN8xZ1aBcD' },
  { id: 'txn_Lk7vW3yT9cD2', object: 'balance_transaction', amount: 4900, currency: 'usd', net: 4728, fee: 172, type: 'charge', status: 'available', created: 1709100000, description: 'Charge for bob.martinez@techcorp.io', source: 'ch_3Lk7vW3yT9cD2eF' },
  { id: 'txn_Mn4jH6sU0eF3', object: 'balance_transaction', amount: 29900, currency: 'usd', net: 29033, fee: 867, type: 'charge', status: 'available', created: 1709200000, description: 'Charge for carol.white@designstudio.co', source: 'ch_3Mn4jH6sU0eF3gH' },
  { id: 'txn_Rq9lJ8sW2hI5', object: 'balance_transaction', amount: 5000, currency: 'usd', net: 4825, fee: 175, type: 'charge', status: 'available', created: 1709400000, description: 'Charge for emma.davis@nonprofit.org', source: 'ch_3Rq9lJ8sW2hI5jK' },
  { id: 'txn_Uv1nL0uY4kK7', object: 'balance_transaction', amount: 59900, currency: 'usd', net: 58166, fee: 1734, type: 'charge', status: 'available', created: 1709600000, description: 'Charge for grace.lee@medtech.health', source: 'ch_3Uv1nL0uY4kK7lM' },
  { id: 'txn_Wx2oM1vZ5lL8', object: 'balance_transaction', amount: 299900, currency: 'usd', net: 291203, fee: 8697, type: 'charge', status: 'available', created: 1709700000, description: 'Charge for henry.chen@globalimports.biz', source: 'ch_3Wx2oM1vZ5lL8mN' },
  { id: 'txn_re_QpR2mN8xZ1aB', object: 'balance_transaction', amount: -1500, currency: 'usd', net: -1500, fee: 0, type: 'refund', status: 'available', created: 1710000000, description: 'Refund for charge ch_3QpR2mN8xZ1aBcD', source: 're_3QpR2mN8xZ1aBcD' },
  { id: 'txn_payout_001', object: 'balance_transaction', amount: -1500000, currency: 'usd', net: -1500000, fee: 0, type: 'payout', status: 'available', created: 1709800000, description: 'STRIPE PAYOUT', source: 'po_QpR2mN8xZ1aBcD' },
]

// ─── Events ───────────────────────────────────────────────────────────────────

export const events: Event[] = [
  {
    id: 'evt_3QpR2mN8xZ1aBcD',
    object: 'event',
    type: 'payment_intent.succeeded',
    created: 1709000100,
    data: { object: { id: 'pi_3QpR2mN8xZ1aBcD', amount: 9900, currency: 'usd', status: 'succeeded', customer: 'cus_QpR2mN8xZ1aB' } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3Lk7vW3yT9cD2eF',
    object: 'event',
    type: 'customer.created',
    created: 1701000100,
    data: { object: { id: 'cus_Lk7vW3yT9cD2', email: 'bob.martinez@techcorp.io', name: 'Bob Martinez' } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3Mn4jH6sU0eF3gH',
    object: 'event',
    type: 'invoice.paid',
    created: 1709200100,
    data: { object: { id: 'in_1Mn4jH6sU0eF3gH', amount_paid: 29900, currency: 'usd', status: 'paid', customer: 'cus_Mn4jH6sU0eF3' } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3Op8kI7rV1gH4iJ',
    object: 'event',
    type: 'payment_intent.payment_failed',
    created: 1709300100,
    data: { object: { id: 'pi_3Op8kI7rV1gH4iJ', amount: 19900, currency: 'usd', status: 'requires_payment_method', customer: 'cus_Op8kI7rV1gH4', last_payment_error: { code: 'card_declined', message: 'Your card was declined.' } } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3Rq9lJ8sW2hI5jK',
    object: 'event',
    type: 'customer.subscription.created',
    created: 1700000100,
    data: { object: { id: 'sub_QpR2mN8xZ1aBcD', status: 'active', customer: 'cus_QpR2mN8xZ1aB', plan: { id: 'plan_pro_monthly', amount: 9900, interval: 'month' } } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3St0mK9tX3jJ6kL',
    object: 'event',
    type: 'customer.subscription.updated',
    created: 1709500100,
    data: { object: { id: 'sub_St0mK9tX3jJ6kL', status: 'past_due', customer: 'cus_St0mK9tX3jJ6', previous_attributes: { status: 'active' } } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3Uv1nL0uY4kK7lM',
    object: 'event',
    type: 'charge.refunded',
    created: 1710000100,
    data: { object: { id: 'ch_3QpR2mN8xZ1aBcD', amount: 9900, amount_refunded: 1500, currency: 'usd', refunded: false, customer: 'cus_QpR2mN8xZ1aB' } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3Wx2oM1vZ5lL8mN',
    object: 'event',
    type: 'invoice.payment_failed',
    created: 1709500200,
    data: { object: { id: 'in_1St0mK9tX3jJ6kL', amount_due: 149900, currency: 'usd', status: 'open', customer: 'cus_St0mK9tX3jJ6', attempt_count: 2 } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3QpR2mN8xZ1aBnO',
    object: 'event',
    type: 'payment_method.attached',
    created: 1700000200,
    data: { object: { id: 'pm_1QpR2mN8xZ1aBcD', type: 'card', card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2027 }, customer: 'cus_QpR2mN8xZ1aB' } },
    livemode: false,
    api_version: '2024-06-20',
  },
  {
    id: 'evt_3Wx2oM1vZ5lL8tU',
    object: 'event',
    type: 'dispute.created',
    created: 1710700000,
    data: { object: { id: 'dp_3Wx2oM1vZ5lL8mN', amount: 29900, currency: 'usd', status: 'needs_response', reason: 'fraudulent', charge: 'ch_3Mn4jH6sU0eF3gH' } },
    livemode: false,
    api_version: '2024-06-20',
  },
]

// ─── Refunds ──────────────────────────────────────────────────────────────────

export const refunds: Refund[] = [
  {
    id: 're_3QpR2mN8xZ1aBcD',
    object: 'refund',
    charge: 'ch_3QpR2mN8xZ1aBcD',
    payment_intent: 'pi_3QpR2mN8xZ1aBcD',
    amount: 1500,
    status: 'succeeded',
    reason: 'requested_by_customer',
    created: 1710000000,
    currency: 'usd',
    metadata: {},
  },
  {
    id: 're_3Lk7vW3yT9cD2eF',
    object: 'refund',
    charge: 'ch_3Mn4jH6sU0eF3gH',
    payment_intent: 'pi_3Mn4jH6sU0eF3gH',
    amount: 29900,
    status: 'succeeded',
    reason: 'duplicate',
    created: 1710100000,
    currency: 'usd',
    metadata: { note: 'duplicate charge identified by ops team' },
  },
  {
    id: 're_3Mn4jH6sU0eF3gH',
    object: 'refund',
    charge: 'ch_3Rq9lJ8sW2hI5jK',
    payment_intent: 'pi_3Rq9lJ8sW2hI5rS',
    amount: 5000,
    status: 'pending',
    reason: 'fraudulent',
    created: 1710200000,
    currency: 'usd',
    metadata: {},
  },
]

// ─── Disputes ─────────────────────────────────────────────────────────────────

export const disputes: Dispute[] = [
  {
    id: 'dp_3QpR2mN8xZ1aBcD',
    object: 'dispute',
    charge: 'ch_3St0mK9tX3jJ6kL',
    payment_intent: 'pi_3St0mK9tX3jJ6',
    amount: 149900,
    status: 'needs_response',
    reason: 'product_not_received',
    created: 1710600000,
    currency: 'usd',
    evidence_details: { due_by: 1711814400, has_evidence: false, past_due: false, submission_count: 0 },
  },
  {
    id: 'dp_3Wx2oM1vZ5lL8mN',
    object: 'dispute',
    charge: 'ch_3Mn4jH6sU0eF3gH',
    payment_intent: 'pi_3Mn4jH6sU0eF3gH',
    amount: 29900,
    status: 'under_review',
    reason: 'fraudulent',
    created: 1710700000,
    currency: 'usd',
    evidence_details: { due_by: 1711900800, has_evidence: true, past_due: false, submission_count: 1 },
  },
]

// ─── Checkout Sessions ────────────────────────────────────────────────────────

export const checkoutSessions: CheckoutSession[] = []
