<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  User,
  FileText,
  Shield,
  Clock,
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
import { paymentsApi, customersApi, type PaymentIntent, type Customer } from '@/lib/api'

const route = useRoute()
const payment = ref<PaymentIntent | null>(null)
const customer = ref<Customer | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const id = route.params.id as string
  try {
    payment.value = await paymentsApi.get(id)
    if (payment.value.customer) {
      try {
        customer.value = await customersApi.get(payment.value.customer)
      } catch {
        // customer may not be accessible
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load payment'
  } finally {
    loading.value = false
  }
})

const formattedAmount = computed(() => {
  if (!payment.value) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: payment.value.currency,
  }).format(payment.value.amount / 100)
})

const formattedCurrency = computed(() => payment.value?.currency.toUpperCase() ?? '')

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(ts * 1000))
}

function getStatusBadgeClass(status: PaymentIntent['status']): string {
  switch (status) {
    case 'succeeded':
      return 'bg-green-100 text-green-700 border border-green-200 text-xs'
    case 'processing':
      return 'bg-blue-100 text-blue-700 border border-blue-200 text-xs'
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_payment_method':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs'
    case 'canceled':
      return 'bg-red-100 text-red-700 border border-red-200 text-xs'
    case 'requires_capture':
      return 'bg-orange-100 text-orange-700 border border-orange-200 text-xs'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200 text-xs'
  }
}

function getStatusLabel(status: PaymentIntent['status']): string {
  switch (status) {
    case 'succeeded': return 'Succeeded'
    case 'processing': return 'Processing'
    case 'requires_action': return 'Requires action'
    case 'requires_confirmation': return 'Requires confirmation'
    case 'requires_payment_method': return 'Incomplete'
    case 'requires_capture': return 'Uncaptured'
    case 'canceled': return 'Canceled'
    default: return status
  }
}

const timelineEvents = computed(() => {
  if (!payment.value) return []
  const events: Array<{ label: string; date: number; note?: string }> = [
    { label: 'Payment created', date: payment.value.created },
  ]
  if (payment.value.status === 'succeeded') {
    events.push({ label: 'Payment succeeded', date: payment.value.created + 5 })
  }
  if (payment.value.status === 'canceled' && payment.value.canceled_at) {
    events.push({
      label: 'Payment canceled',
      date: payment.value.canceled_at,
      note: payment.value.cancellation_reason ?? undefined,
    })
  }
  return events.reverse()
})

const metadataEntries = computed(() => {
  if (!payment.value) return []
  return Object.entries(payment.value.metadata)
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Back link -->
    <div>
      <RouterLink
        to="/payments"
        class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        Payments
      </RouterLink>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Loading header -->
    <template v-if="loading">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <Skeleton class="h-8 w-40" />
          <Skeleton class="h-5 w-64" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-8 w-20" />
          <Skeleton class="h-8 w-28" />
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <Skeleton class="h-64 w-full rounded-lg" />
          <Skeleton class="h-40 w-full rounded-lg" />
        </div>
        <div class="space-y-4">
          <Skeleton class="h-28 w-full rounded-lg" />
          <Skeleton class="h-28 w-full rounded-lg" />
          <Skeleton class="h-28 w-full rounded-lg" />
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else-if="payment">
      <!-- Page header -->
      <div class="flex items-start justify-between">
        <div class="space-y-1.5">
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-semibold text-foreground tracking-tight">
              {{ formattedAmount }}
            </h1>
            <span class="text-lg text-muted-foreground font-normal">{{ formattedCurrency }}</span>
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 font-medium',
                getStatusBadgeClass(payment.status)
              ]"
            >
              {{ getStatusLabel(payment.status) }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground font-mono">{{ payment.id }}</p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" class="text-xs">
            Refund
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="gap-1.5 text-xs">
                Actions
                <ChevronDown class="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Capture payment</DropdownMenuItem>
              <DropdownMenuItem>Copy payment ID</DropdownMenuItem>
              <DropdownMenuItem>View in API</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive">Cancel payment</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- LEFT column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Payment details card -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-sm font-semibold text-foreground">Payment details</CardTitle>
            </CardHeader>
            <CardContent class="px-6 pb-0">
              <div class="grid grid-cols-2 gap-x-8">
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Amount</p>
                  <p class="text-sm font-medium text-foreground">{{ formattedAmount }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Currency</p>
                  <p class="text-sm font-medium text-foreground uppercase">{{ payment.currency }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Payment method</p>
                  <div class="flex items-center gap-1.5">
                    <CreditCard class="h-3.5 w-3.5 text-muted-foreground" />
                    <p class="text-sm font-medium text-foreground">
                      {{ payment.payment_method ? `Card •••• ${payment.payment_method.slice(-4)}` : '—' }}
                    </p>
                  </div>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Capture method</p>
                  <p class="text-sm font-medium text-foreground capitalize">{{ payment.capture_method }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Description</p>
                  <p class="text-sm text-foreground">{{ payment.description || '—' }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Receipt email</p>
                  <p class="text-sm text-foreground">{{ payment.receipt_email || '—' }}</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Statement descriptor</p>
                  <p class="text-sm text-foreground">—</p>
                </div>
                <div class="py-3 border-b border-border">
                  <p class="text-xs text-muted-foreground mb-1">Created</p>
                  <p class="text-sm text-foreground">{{ formatDate(payment.created) }}</p>
                </div>
              </div>

              <!-- Radar risk score -->
              <div class="py-4">
                <div class="flex items-center gap-2 mb-3">
                  <Shield class="h-3.5 w-3.5 text-muted-foreground" />
                  <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Radar risk score</p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div class="h-full w-[18%] rounded-full bg-green-500" />
                  </div>
                  <span class="text-sm font-medium text-foreground whitespace-nowrap">18 — Normal</span>
                </div>
                <p class="text-xs text-muted-foreground mt-1">Evaluated by Stripe Radar</p>
              </div>
            </CardContent>
          </Card>

          <!-- Timeline -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock class="h-4 w-4 text-muted-foreground" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol class="relative border-l border-border space-y-5 ml-2 pl-1">
                <li v-for="(event, idx) in timelineEvents" :key="idx" class="ml-4">
                  <div class="absolute -left-[7px] mt-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white ring-1 ring-blue-200" />
                  <p class="text-sm font-medium text-foreground leading-tight">{{ event.label }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(event.date) }}</p>
                  <p v-if="event.note" class="text-xs text-muted-foreground mt-0.5 italic">{{ event.note }}</p>
                </li>
              </ol>
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
              <template v-if="customer">
                <RouterLink
                  :to="`/customers/${customer.id}`"
                  class="text-sm font-medium text-blue-600 hover:underline"
                >
                  {{ customer.name || customer.email || customer.id }}
                </RouterLink>
                <p v-if="customer.email && customer.name" class="text-xs text-muted-foreground mt-0.5">
                  {{ customer.email }}
                </p>
                <p class="text-xs text-muted-foreground font-mono mt-1">{{ customer.id }}</p>
              </template>
              <template v-else-if="payment.customer">
                <RouterLink
                  :to="`/customers/${payment.customer}`"
                  class="text-sm font-medium text-blue-600 hover:underline"
                >
                  {{ payment.customer }}
                </RouterLink>
              </template>
              <p v-else class="text-sm text-muted-foreground">No customer</p>
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
            <CardContent class="space-y-2">
              <template v-if="payment.payment_method">
                <div class="flex items-center gap-2.5">
                  <div class="h-8 w-12 rounded border border-border bg-muted flex items-center justify-center shrink-0">
                    <CreditCard class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-foreground">
                      Card •••• {{ payment.payment_method.slice(-4) }}
                    </p>
                    <p class="text-xs text-muted-foreground">Expiry —/—</p>
                  </div>
                </div>
              </template>
              <p v-else class="text-sm text-muted-foreground">No payment method on file</p>
            </CardContent>
          </Card>

          <!-- Metadata card -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText class="h-4 w-4 text-muted-foreground" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <template v-if="metadataEntries.length > 0">
                <div
                  v-for="[key, value] in metadataEntries"
                  :key="key"
                  class="py-2 border-b border-border last:border-0"
                >
                  <p class="text-xs font-medium text-muted-foreground">{{ key }}</p>
                  <p class="text-sm text-foreground break-all">{{ value }}</p>
                </div>
              </template>
              <p v-else class="text-sm text-muted-foreground">No metadata</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
