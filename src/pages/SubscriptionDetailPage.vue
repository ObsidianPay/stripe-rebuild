<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  User,
  Calendar,
  FileText,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  subscriptionsApi,
  customersApi,
  invoicesApi,
  type Subscription,
  type Customer,
  type Invoice,
} from '@/lib/api'

const route = useRoute()
const subscription = ref<Subscription | null>(null)
const customer = ref<Customer | null>(null)
const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const canceling = ref(false)

onMounted(async () => {
  const id = route.params.id as string
  try {
    subscription.value = await subscriptionsApi.get(id)
    await Promise.all([
      (async () => {
        if (subscription.value?.customer) {
          try {
            customer.value = await customersApi.get(subscription.value.customer)
          } catch { /* ignore */ }
        }
      })(),
      (async () => {
        try {
          const res = await invoicesApi.list({ subscription: id, limit: 3 })
          invoices.value = res.data
        } catch { /* ignore */ }
      })(),
    ])
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load subscription'
  } finally {
    loading.value = false
  }
})

async function cancelSubscription() {
  if (!subscription.value || canceling.value) return
  canceling.value = true
  try {
    subscription.value = await subscriptionsApi.cancel(subscription.value.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to cancel subscription'
  } finally {
    canceling.value = false
  }
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

function formatDateShort(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

const planName = computed(() => {
  const item = subscription.value?.items.data[0]
  return item?.price.nickname || 'Subscription'
})

const planAmount = computed(() => {
  const item = subscription.value?.items.data[0]
  if (!item || item.price.unit_amount == null) return '—'
  const total = item.price.unit_amount * (item.quantity || 1)
  return formatAmount(total, item.price.currency)
})

const planInterval = computed(() => {
  const item = subscription.value?.items.data[0]
  if (!item?.price.recurring) return ''
  const { interval, interval_count } = item.price.recurring
  return interval_count === 1 ? `/ ${interval}` : `/ ${interval_count} ${interval}s`
})

const customerDisplay = computed(() => {
  if (!customer.value) return subscription.value?.customer ?? '—'
  return customer.value.name || customer.value.email || customer.value.id
})

function getStatusBadgeClass(status: Subscription['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 border border-green-200'
    case 'trialing':
      return 'bg-blue-100 text-blue-700 border border-blue-200'
    case 'past_due':
    case 'unpaid':
      return 'bg-red-100 text-red-700 border border-red-200'
    case 'canceled':
    case 'incomplete_expired':
      return 'bg-gray-100 text-gray-500 border border-gray-200'
    case 'incomplete':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    case 'paused':
      return 'bg-orange-100 text-orange-700 border border-orange-200'
    default:
      return 'bg-gray-100 text-gray-500 border border-gray-200'
  }
}

function getStatusLabel(status: Subscription['status']): string {
  switch (status) {
    case 'active': return 'Active'
    case 'trialing': return 'Trialing'
    case 'past_due': return 'Past due'
    case 'canceled': return 'Canceled'
    case 'unpaid': return 'Unpaid'
    case 'incomplete': return 'Incomplete'
    case 'incomplete_expired': return 'Expired'
    case 'paused': return 'Paused'
    default: return status
  }
}

function getInvoiceStatusClass(status: Invoice['status']): string {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700 border border-green-200'
    case 'open': return 'bg-blue-100 text-blue-700 border border-blue-200'
    case 'draft': return 'bg-gray-100 text-gray-500 border border-gray-200'
    case 'void': return 'bg-red-100 text-red-700 border border-red-200'
    case 'uncollectible': return 'bg-orange-100 text-orange-700 border border-orange-200'
    default: return 'bg-gray-100 text-gray-500 border border-gray-200'
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Back link -->
    <RouterLink
      to="/subscriptions"
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft class="h-4 w-4" />
      Subscriptions
    </RouterLink>

    <!-- Error -->
    <div v-if="error" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <Skeleton class="h-7 w-48" />
          <Skeleton class="h-5 w-24" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-8 w-36" />
          <Skeleton class="h-8 w-28" />
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <Skeleton class="h-64 w-full rounded-lg" />
          <Skeleton class="h-48 w-full rounded-lg" />
        </div>
        <div class="space-y-4">
          <Skeleton class="h-28 w-full rounded-lg" />
          <Skeleton class="h-28 w-full rounded-lg" />
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else-if="subscription">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="space-y-1.5">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-semibold text-foreground">{{ planName }}</h1>
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                getStatusBadgeClass(subscription.status)
              ]"
            >
              {{ getStatusLabel(subscription.status) }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground font-mono">{{ subscription.id }}</p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
            :disabled="subscription.status === 'canceled' || canceling"
            @click="cancelSubscription"
          >
            {{ canceling ? 'Canceling…' : 'Cancel subscription' }}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="gap-1.5 text-xs">
                Actions
                <ChevronDown class="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Update subscription</DropdownMenuItem>
              <DropdownMenuItem>Pause collection</DropdownMenuItem>
              <DropdownMenuItem>Resume subscription</DropdownMenuItem>
              <DropdownMenuItem>Copy ID</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive">Cancel immediately</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- LEFT column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Details card -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-sm font-semibold text-foreground">Subscription details</CardTitle>
            </CardHeader>
            <CardContent class="px-6 pb-2">
              <div class="grid grid-cols-2 gap-x-8">
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Customer</p>
                  <RouterLink
                    v-if="subscription.customer"
                    :to="`/customers/${subscription.customer}`"
                    class="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {{ customerDisplay }}
                  </RouterLink>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Amount</p>
                  <p class="text-sm font-medium text-foreground">
                    {{ planAmount }}
                    <span class="text-xs text-muted-foreground ml-1">{{ planInterval }}</span>
                  </p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Current period start</p>
                  <div class="flex items-center gap-1.5">
                    <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
                    <p class="text-sm text-foreground">{{ formatDate(subscription.current_period_start) }}</p>
                  </div>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Current period end</p>
                  <div class="flex items-center gap-1.5">
                    <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
                    <p class="text-sm text-foreground">{{ formatDate(subscription.current_period_end) }}</p>
                  </div>
                </div>
                <div v-if="subscription.trial_end" class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Trial end</p>
                  <p class="text-sm text-foreground">{{ formatDate(subscription.trial_end) }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Next invoice</p>
                  <p class="text-sm text-foreground">{{ formatDate(subscription.current_period_end) }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Created</p>
                  <p class="text-sm text-foreground">{{ formatDate(subscription.created) }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Cancel at period end</p>
                  <p class="text-sm text-foreground">{{ subscription.cancel_at_period_end ? 'Yes' : 'No' }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Invoice history -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText class="h-4 w-4 text-muted-foreground" />
                Recent invoices
              </CardTitle>
            </CardHeader>
            <CardContent class="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow class="hover:bg-transparent">
                    <TableHead class="text-xs pl-6">Invoice</TableHead>
                    <TableHead class="text-xs">Amount</TableHead>
                    <TableHead class="text-xs">Status</TableHead>
                    <TableHead class="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="invoices.length === 0">
                    <TableCell colspan="4" class="text-center text-sm text-muted-foreground h-20 pl-6">
                      No invoices yet.
                    </TableCell>
                  </TableRow>
                  <TableRow
                    v-for="inv in invoices"
                    :key="inv.id"
                    class="hover:bg-muted/30"
                  >
                    <TableCell class="pl-6">
                      <RouterLink
                        :to="`/invoices/${inv.id}`"
                        class="text-sm font-medium text-blue-600 hover:underline font-mono"
                      >
                        {{ inv.number || inv.id.slice(0, 12) }}
                      </RouterLink>
                    </TableCell>
                    <TableCell class="text-sm text-foreground">
                      {{ formatAmount(inv.amount_due, inv.currency) }}
                    </TableCell>
                    <TableCell>
                      <span
                        :class="[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          getInvoiceStatusClass(inv.status)
                        ]"
                      >
                        {{ inv.status.charAt(0).toUpperCase() + inv.status.slice(1) }}
                      </span>
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {{ formatDateShort(inv.created) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <!-- RIGHT column -->
        <div class="space-y-4">
          <!-- Customer card -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-semibold text-foreground flex items-center gap-2">
                <User class="h-4 w-4 text-muted-foreground" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RouterLink
                :to="`/customers/${subscription.customer}`"
                class="text-sm font-medium text-blue-600 hover:underline block"
              >
                {{ customerDisplay }}
              </RouterLink>
              <p v-if="customer?.email" class="text-xs text-muted-foreground mt-0.5">{{ customer.email }}</p>
              <p class="text-xs text-muted-foreground font-mono mt-1">{{ subscription.customer }}</p>
            </CardContent>
          </Card>

          <!-- Payment method card -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard class="h-4 w-4 text-muted-foreground" />
                Payment method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <template v-if="subscription.default_payment_method">
                <div class="flex items-center gap-2.5">
                  <div class="h-8 w-12 rounded border border-border bg-muted flex items-center justify-center shrink-0">
                    <CreditCard class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-foreground">
                      Card •••• {{ subscription.default_payment_method.slice(-4) }}
                    </p>
                    <p class="text-xs text-muted-foreground">Default</p>
                  </div>
                </div>
              </template>
              <p v-else class="text-sm text-muted-foreground">No payment method on file</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
