<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  customersApi,
  type Customer,
  type PaymentIntent,
  type Subscription,
  type Invoice,
  type PaymentMethod,
} from '@/lib/api'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  X,
  MoreHorizontal,
  Plus,
  CreditCard,
  ArrowLeft,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

// ── Route ─────────────────────────────────────────────────────────────────────

const route = useRoute()
const customerId = route.params.id as string

// ── State ─────────────────────────────────────────────────────────────────────

const customer = ref<Customer | null>(null)
const subscriptions = ref<Subscription[]>([])
const payments = ref<PaymentIntent[]>([])
const paymentMethods = ref<PaymentMethod[]>([])
const invoices = ref<Invoice[]>([])

const loading = ref(true)
const error = ref<string | null>(null)

// Collapsible panels
const detailsOpen = ref(true)
const metadataOpen = ref(false)
const showMoreDetails = ref(false)

// Payment methods expand
const expandedPaymentMethods = ref<Set<string>>(new Set())

// Selected payments (checkboxes)
const selectedPayments = ref<Set<string>>(new Set())

// ── Data fetching ─────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const [cust, subs, pays, pms, invs] = await Promise.all([
      customersApi.get(customerId),
      customersApi.getSubscriptions(customerId),
      customersApi.getPayments(customerId),
      customersApi.getPaymentMethods(customerId),
      customersApi.getInvoices(customerId),
    ])
    customer.value = cust
    subscriptions.value = subs.data
    payments.value = pays.data
    paymentMethods.value = pms.data
    invoices.value = invs.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load customer'
  } finally {
    loading.value = false
  }
})

// ── Computed ──────────────────────────────────────────────────────────────────

const displayName = computed(() =>
  customer.value?.name ?? customer.value?.email ?? customerId,
)

const totalSpent = computed(() =>
  payments.value
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount_received, 0),
)

const defaultCurrency = computed(() => {
  if (customer.value?.currency) return customer.value.currency
  if (payments.value.length) return payments.value[0].currency
  return 'usd'
})

const mrr = computed(() => {
  const activeSub = subscriptions.value.find((s) => s.status === 'active')
  if (!activeSub) return null
  const item = activeSub.items.data[0]
  if (!item?.price) return null
  const price = item.price
  if (!price.unit_amount) return null
  if (price.recurring?.interval === 'month') return { amount: price.unit_amount, currency: price.currency }
  if (price.recurring?.interval === 'year') return { amount: Math.round(price.unit_amount / 12), currency: price.currency }
  return null
})

const memberSince = computed(() => {
  if (!customer.value) return null
  const d = new Date(customer.value.created * 1000)
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d)
})

const metadataEntries = computed(() => {
  if (!customer.value?.metadata) return []
  return Object.entries(customer.value.metadata)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function subscriptionBillingLabel(sub: Subscription): string {
  const item = sub.items.data[0]
  if (!item?.price?.recurring) return ''
  const { interval, interval_count } = item.price.recurring
  const count = interval_count ?? 1
  if (count === 1) return `Billed ${interval}ly`
  return `Every ${count} ${interval}s`
}

function subscriptionPlanName(sub: Subscription): string {
  const item = sub.items.data[0]
  if (!item?.price) return 'Unknown plan'
  return item.price.nickname ?? item.price.product ?? 'Plan'
}

function subscriptionAmount(sub: Subscription): string {
  const item = sub.items.data[0]
  if (!item?.price?.unit_amount) return '—'
  return formatCurrency(item.price.unit_amount, item.price.currency)
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
    case 'succeeded':
    case 'paid':
      return 'bg-green-100 text-green-700 border border-green-200'
    case 'past_due':
    case 'unpaid':
    case 'failed':
    case 'canceled':
      return 'bg-red-100 text-red-600 border border-red-200'
    case 'trialing':
    case 'processing':
      return 'bg-blue-100 text-blue-700 border border-blue-200'
    default:
      return 'bg-muted text-muted-foreground border border-border'
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

function cardBrandLabel(brand: string): string {
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

function togglePaymentMethodExpand(id: string) {
  if (expandedPaymentMethods.value.has(id)) {
    expandedPaymentMethods.value.delete(id)
  } else {
    expandedPaymentMethods.value.add(id)
  }
}

function togglePaymentSelect(id: string) {
  if (selectedPayments.value.has(id)) {
    selectedPayments.value.delete(id)
  } else {
    selectedPayments.value.add(id)
  }
}

function isDefaultPaymentMethod(pm: PaymentMethod): boolean {
  return customer.value?.default_source === pm.id
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex flex-col gap-6 p-6">
    <div class="flex items-center gap-3">
      <Skeleton class="size-12 rounded-full" />
      <div class="flex flex-col gap-2">
        <Skeleton class="h-6 w-48" />
        <Skeleton class="h-4 w-32" />
      </div>
    </div>
    <div class="flex gap-6">
      <Skeleton class="h-16 w-32" />
      <Skeleton class="h-16 w-32" />
      <Skeleton class="h-16 w-32" />
    </div>
    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-1 flex flex-col gap-4">
        <Skeleton class="h-48 rounded-lg" />
        <Skeleton class="h-24 rounded-lg" />
      </div>
      <div class="col-span-2">
        <Skeleton class="h-96 rounded-lg" />
      </div>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="error" class="flex flex-col items-center justify-center gap-4 p-12 text-center">
    <div class="text-muted-foreground">{{ error }}</div>
    <Button variant="outline" as-child>
      <RouterLink to="/customers">
        <ArrowLeft class="size-4" />
        Back to customers
      </RouterLink>
    </Button>
  </div>

  <!-- Page content -->
  <div v-else-if="customer" class="flex flex-col gap-0">
    <!-- Top header bar -->
    <div class="flex items-center justify-between border-b bg-background px-6 py-4">
      <div class="flex items-center gap-4">
        <RouterLink
          to="/customers"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft class="size-4" />
        </RouterLink>

        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {{ getInitials(customer.name) }}
          </div>
          <div>
            <h1 class="text-xl font-semibold text-foreground leading-tight">
              {{ displayName }}
            </h1>
            <p class="text-sm text-muted-foreground">{{ customer.email }}</p>
          </div>
        </div>
      </div>

      <!-- Actions dropdown -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            Actions
            <ChevronDown class="size-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem>Edit customer</DropdownMenuItem>
          <DropdownMenuItem>Create payment</DropdownMenuItem>
          <DropdownMenuItem>Create subscription</DropdownMenuItem>
          <DropdownMenuItem>Create invoice</DropdownMenuItem>
          <DropdownMenuItem class="text-destructive focus:text-destructive">
            Delete customer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Stats row -->
    <div class="flex items-stretch border-b bg-background">
      <div class="flex flex-col px-6 py-4 border-r">
        <span class="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Spent</span>
        <span class="text-lg font-bold text-foreground">
          {{ formatCurrency(totalSpent, defaultCurrency) }}
        </span>
      </div>
      <div class="flex flex-col px-6 py-4 border-r">
        <span class="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Since</span>
        <span class="text-lg font-bold text-foreground">{{ memberSince }}</span>
      </div>
      <div class="flex flex-col px-6 py-4">
        <span class="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">MRR</span>
        <span class="text-lg font-bold text-foreground">
          {{ mrr ? formatCurrency(mrr.amount, mrr.currency) : '$0.00' }}
        </span>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="grid grid-cols-[320px_1fr] gap-0 min-h-0">
      <!-- LEFT COLUMN -->
      <div class="flex flex-col gap-4 border-r bg-background p-4 overflow-y-auto">

        <!-- Details card -->
        <div class="rounded-lg border bg-card shadow-xs">
          <button
            class="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors rounded-t-lg"
            @click="detailsOpen = !detailsOpen"
          >
            Details
            <component :is="detailsOpen ? ChevronDown : ChevronRight" class="size-4 text-muted-foreground" />
          </button>

          <div v-if="detailsOpen">
            <Separator />
            <div class="flex flex-col gap-4 p-4 text-sm">
              <!-- Customer ID -->
              <div>
                <p class="text-xs text-muted-foreground mb-1 font-medium">Customer ID</p>
                <p class="font-mono text-xs text-foreground break-all select-all">{{ customer.id }}</p>
              </div>

              <!-- Account details -->
              <div>
                <p class="text-xs text-muted-foreground mb-1 font-medium">Account details</p>
                <div class="flex flex-col gap-0.5">
                  <p class="text-foreground">{{ customer.name ?? '—' }}</p>
                  <p class="text-muted-foreground text-xs">{{ customer.email ?? '—' }}</p>
                  <p v-if="customer.phone" class="text-muted-foreground text-xs">{{ customer.phone }}</p>
                </div>
              </div>

              <!-- Billing emails -->
              <div>
                <p class="text-xs text-muted-foreground mb-1 font-medium">Billing emails</p>
                <p class="text-foreground">{{ customer.email ?? '—' }}</p>
              </div>

              <!-- Address (shown in "show more") -->
              <template v-if="showMoreDetails">
                <div v-if="customer.address">
                  <p class="text-xs text-muted-foreground mb-1 font-medium">Address</p>
                  <div class="text-foreground text-xs flex flex-col gap-0.5">
                    <span v-if="customer.address.line1">{{ customer.address.line1 }}</span>
                    <span v-if="customer.address.line2">{{ customer.address.line2 }}</span>
                    <span v-if="customer.address.city || customer.address.state || customer.address.postal_code">
                      {{ [customer.address.city, customer.address.state, customer.address.postal_code].filter(Boolean).join(', ') }}
                    </span>
                    <span v-if="customer.address.country">{{ customer.address.country }}</span>
                  </div>
                </div>

                <div>
                  <p class="text-xs text-muted-foreground mb-1 font-medium">Description</p>
                  <p class="text-foreground text-xs">{{ customer.description || '—' }}</p>
                </div>

                <div>
                  <p class="text-xs text-muted-foreground mb-1 font-medium">Currency</p>
                  <p class="text-foreground text-xs uppercase">{{ customer.currency ?? 'usd' }}</p>
                </div>

                <div>
                  <p class="text-xs text-muted-foreground mb-1 font-medium">Created</p>
                  <p class="text-foreground text-xs">{{ formatDateTime(customer.created) }}</p>
                </div>
              </template>

              <button
                class="text-xs text-primary hover:underline text-left"
                @click="showMoreDetails = !showMoreDetails"
              >
                {{ showMoreDetails ? 'Show less' : 'Show more' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Metadata card -->
        <div class="rounded-lg border bg-card shadow-xs">
          <button
            class="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors rounded-lg"
            @click="metadataOpen = !metadataOpen"
          >
            Metadata
            <component :is="metadataOpen ? ChevronDown : ChevronRight" class="size-4 text-muted-foreground" />
          </button>

          <div v-if="metadataOpen">
            <Separator />
            <div class="p-4">
              <div v-if="metadataEntries.length === 0" class="text-xs text-muted-foreground">
                No metadata
              </div>
              <div v-else class="flex flex-col gap-2">
                <div
                  v-for="[key, value] in metadataEntries"
                  :key="key"
                  class="flex flex-col gap-0.5"
                >
                  <span class="text-xs font-mono text-muted-foreground">{{ key }}</span>
                  <span class="text-xs font-mono text-foreground break-all">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="flex flex-col bg-muted/20 overflow-y-auto">
        <Tabs default-value="overview" class="flex flex-col h-full">
          <div class="border-b bg-background px-4">
            <TabsList variant="line" class="h-10">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events and logs</TabsTrigger>
            </TabsList>
          </div>

          <!-- ── Overview tab ── -->
          <TabsContent value="overview" class="flex flex-col gap-4 p-4 mt-0">

            <!-- Subscriptions section -->
            <div class="rounded-lg border bg-card shadow-xs">
              <div class="flex items-center justify-between px-4 py-3 border-b">
                <h3 class="text-sm font-semibold text-foreground">Subscriptions</h3>
                <RouterLink to="#" class="text-primary text-sm hover:underline">+ Create</RouterLink>
              </div>

              <div v-if="subscriptions.length === 0" class="px-4 py-6 text-sm text-muted-foreground text-center">
                No subscriptions
              </div>

              <div
                v-for="sub in subscriptions"
                :key="sub.id"
                class="flex items-start justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-foreground">
                      {{ subscriptionPlanName(sub) }}
                    </span>
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="statusBadgeClass(sub.status)"
                    >
                      {{ statusLabel(sub.status) }}
                    </span>
                  </div>
                  <div class="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    <span>
                      {{ subscriptionAmount(sub) }} &middot; {{ subscriptionBillingLabel(sub) }}
                    </span>
                    <span>
                      Next invoice {{ formatDate(sub.current_period_end) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="icon" class="size-7">
                    <Edit2 class="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" class="size-7 text-muted-foreground hover:text-destructive">
                    <X class="size-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" class="size-7">
                        <MoreHorizontal class="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View subscription</DropdownMenuItem>
                      <DropdownMenuItem>Edit subscription</DropdownMenuItem>
                      <DropdownMenuItem>Pause subscription</DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive focus:text-destructive">
                        Cancel subscription
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <!-- Payments section -->
            <div class="rounded-lg border bg-card shadow-xs">
              <div class="flex items-center justify-between px-4 py-3 border-b">
                <h3 class="text-sm font-semibold text-foreground">Payments</h3>
                <div class="flex items-center gap-3">
                  <RouterLink to="/payments" class="text-primary text-sm hover:underline">View all</RouterLink>
                  <RouterLink to="#" class="text-primary text-sm hover:underline">+ Create</RouterLink>
                </div>
              </div>

              <div v-if="payments.length === 0" class="px-4 py-6 text-sm text-muted-foreground text-center">
                No payments
              </div>

              <Table v-else>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-8 pl-4">
                      <Checkbox
                        :checked="selectedPayments.size === payments.length && payments.length > 0"
                        @update:checked="(v: boolean) => {
                          if (v) payments.forEach(p => selectedPayments.add(p.id))
                          else selectedPayments.clear()
                        }"
                      />
                    </TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead class="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="payment in payments"
                    :key="payment.id"
                    class="cursor-pointer hover:bg-muted/40"
                  >
                    <TableCell class="pl-4">
                      <Checkbox
                        :checked="selectedPayments.has(payment.id)"
                        @update:checked="() => togglePaymentSelect(payment.id)"
                      />
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-foreground">
                          {{ formatCurrency(payment.amount_received || payment.amount, payment.currency) }}
                        </span>
                        <span class="text-xs text-muted-foreground uppercase">{{ payment.currency }}</span>
                        <span
                          v-if="payment.status === 'succeeded'"
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                        >
                          Succeeded
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          :class="statusBadgeClass(payment.status)"
                        >
                          {{ statusLabel(payment.status) }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground max-w-[200px] truncate">
                      {{ payment.description ?? '—' }}
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground whitespace-nowrap">
                      {{ formatDateTime(payment.created) }}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="icon" class="size-7">
                            <MoreHorizontal class="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem as-child>
                            <RouterLink :to="`/payments/${payment.id}`">View payment</RouterLink>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Refund payment</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Payment methods section -->
            <div class="rounded-lg border bg-card shadow-xs">
              <div class="flex items-center justify-between px-4 py-3 border-b">
                <h3 class="text-sm font-semibold text-foreground">Payment methods</h3>
                <RouterLink to="#" class="text-primary text-sm hover:underline">+ Add</RouterLink>
              </div>

              <div v-if="paymentMethods.length === 0" class="px-4 py-6 text-sm text-muted-foreground text-center">
                No payment methods
              </div>

              <div
                v-for="pm in paymentMethods"
                :key="pm.id"
                class="border-b last:border-b-0"
              >
                <!-- Card row -->
                <div class="flex items-center justify-between px-4 py-3">
                  <div class="flex items-center gap-3">
                    <button
                      class="text-muted-foreground hover:text-foreground transition-colors"
                      @click="togglePaymentMethodExpand(pm.id)"
                    >
                      <component
                        :is="expandedPaymentMethods.has(pm.id) ? ChevronDown : ChevronRight"
                        class="size-4"
                      />
                    </button>

                    <div class="flex h-7 w-10 items-center justify-center rounded border bg-muted text-muted-foreground">
                      <CreditCard class="size-4" />
                    </div>

                    <div class="flex items-center gap-2 text-sm">
                      <span class="font-medium text-foreground">
                        {{ pm.card ? cardBrandLabel(pm.card.brand) : pm.type }}
                        &bull;&bull;&bull;&bull; {{ pm.card?.last4 }}
                      </span>
                      <Badge
                        v-if="isDefaultPaymentMethod(pm)"
                        variant="secondary"
                        class="text-xs"
                      >
                        Default
                      </Badge>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <span v-if="pm.card" class="text-xs text-muted-foreground">
                      Expires {{ pm.card.exp_month }}/{{ pm.card.exp_year }}
                    </span>

                    <div class="flex items-center gap-1">
                      <Button variant="ghost" size="icon" class="size-7">
                        <Edit2 class="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" class="size-7 text-muted-foreground hover:text-destructive">
                        <X class="size-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="icon" class="size-7">
                            <MoreHorizontal class="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Set as default</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem class="text-destructive focus:text-destructive">
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <!-- Expanded details -->
                <div
                  v-if="expandedPaymentMethods.has(pm.id) && pm.card"
                  class="border-t bg-muted/20 px-4 py-3"
                >
                  <div class="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p class="text-muted-foreground mb-0.5 font-medium">Brand</p>
                      <p class="text-foreground">{{ cardBrandLabel(pm.card.brand) }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-0.5 font-medium">Funding</p>
                      <p class="text-foreground capitalize">{{ pm.card.funding }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-0.5 font-medium">Last 4 digits</p>
                      <p class="text-foreground font-mono">&bull;&bull;&bull;&bull; {{ pm.card.last4 }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-0.5 font-medium">Country</p>
                      <p class="text-foreground">{{ pm.card.country ?? '—' }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-0.5 font-medium">Expiry</p>
                      <p class="text-foreground">{{ pm.card.exp_month }}/{{ pm.card.exp_year }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-0.5 font-medium">ID</p>
                      <p class="text-foreground font-mono text-[10px] break-all">{{ pm.id }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Credit balance section -->
            <div class="rounded-lg border bg-card shadow-xs">
              <div class="flex items-center justify-between px-4 py-3 border-b">
                <h3 class="text-sm font-semibold text-foreground">Credit balance</h3>
                <RouterLink to="#" class="text-primary text-sm hover:underline">Adjust balance</RouterLink>
              </div>
              <div class="flex items-center gap-2 px-4 py-3">
                <span class="text-lg font-bold text-foreground">
                  {{ formatCurrency(Math.abs(customer.balance), customer.currency ?? 'usd') }}
                </span>
                <span class="text-sm text-muted-foreground uppercase font-medium">
                  {{ (customer.currency ?? 'usd').toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Invoices section -->
            <div class="rounded-lg border bg-card shadow-xs">
              <div class="flex items-center justify-between px-4 py-3 border-b">
                <h3 class="text-sm font-semibold text-foreground">Invoices</h3>
                <div class="flex items-center gap-3">
                  <RouterLink to="/invoices" class="text-primary text-sm hover:underline">View all</RouterLink>
                  <RouterLink to="#" class="text-primary text-sm hover:underline">+ Create</RouterLink>
                </div>
              </div>

              <div v-if="invoices.length === 0" class="px-4 py-6 text-sm text-muted-foreground text-center">
                No invoices
              </div>

              <div
                v-for="invoice in invoices.slice(0, 5)"
                :key="invoice.id"
                class="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="text-sm">
                    <span class="font-medium text-foreground">
                      {{ invoice.number ?? invoice.id.slice(0, 16) + '…' }}
                    </span>
                  </div>
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="statusBadgeClass(invoice.status)"
                  >
                    {{ statusLabel(invoice.status) }}
                  </span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm font-semibold text-foreground">
                    {{ formatCurrency(invoice.amount_due, invoice.currency) }}
                  </span>
                  <span class="text-xs text-muted-foreground whitespace-nowrap">
                    {{ formatDate(invoice.created) }}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" class="size-7">
                        <MoreHorizontal class="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem as-child>
                        <RouterLink :to="`/invoices/${invoice.id}`">View invoice</RouterLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="invoice.hosted_invoice_url" as-child>
                        <a :href="invoice.hosted_invoice_url" target="_blank" rel="noopener">Open hosted invoice</a>
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="invoice.invoice_pdf" as-child>
                        <a :href="invoice.invoice_pdf" target="_blank" rel="noopener">Download PDF</a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <!-- Show all link when more than 5 -->
              <div
                v-if="invoices.length > 5"
                class="px-4 py-2.5 text-center"
              >
                <RouterLink to="/invoices" class="text-primary text-sm hover:underline">
                  View all {{ invoices.length }} invoices
                </RouterLink>
              </div>
            </div>
          </TabsContent>

          <!-- ── Events and logs tab ── -->
          <TabsContent value="events" class="flex flex-col gap-4 p-4 mt-0">
            <div class="rounded-lg border bg-card shadow-xs">
              <div class="px-4 py-3 border-b">
                <h3 class="text-sm font-semibold text-foreground">Events and logs</h3>
              </div>
              <div class="px-4 py-10 flex flex-col items-center justify-center text-center gap-2">
                <p class="text-sm text-muted-foreground">
                  Event history for this customer will appear here.
                </p>
                <RouterLink to="/developers" class="text-primary text-sm hover:underline">
                  View in developer logs
                </RouterLink>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
</template>
