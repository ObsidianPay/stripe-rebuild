<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js'
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Plus,
  UserPlus,
  RefreshCw,
  ArrowRight,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { paymentsApi, balanceApi } from '@/lib/api'
import type { PaymentIntent, Balance } from '@/lib/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend)

// ─── State ────────────────────────────────────────────────────────────────────

const loading = ref(true)
const recentPayments = ref<PaymentIntent[]>([])
const balance = ref<Balance | null>(null)

// ─── Chart data ───────────────────────────────────────────────────────────────

const chartData = computed(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Volume',
      data: [420, 780, 560, 1240, 930, 1100, 870],
      backgroundColor: 'rgb(99, 102, 241)',
      borderRadius: 4,
      borderSkipped: false,
      hoverBackgroundColor: 'rgb(79, 82, 221)',
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: { y: number | null } }) =>
          `$${(ctx.parsed.y ?? 0).toLocaleString()}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#6b7280', font: { size: 12 } },
    },
    y: {
      grid: { color: '#f3f4f6', drawTicks: false },
      border: { display: false, dash: [4, 4] },
      ticks: {
        color: '#6b7280',
        font: { size: 12 },
        callback: (value: unknown) => `$${Number(value).toLocaleString()}`,
      },
    },
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts * 1000))
}

const statusConfig: Record<string, { label: string; class: string }> = {
  succeeded: { label: 'Succeeded', class: 'bg-green-50 text-green-700 border-green-200' },
  processing: { label: 'Processing', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  requires_payment_method: { label: 'Failed', class: 'bg-red-50 text-red-700 border-red-200' },
  requires_confirmation: { label: 'Pending', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  requires_action: { label: 'Pending', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  canceled: { label: 'Canceled', class: 'bg-gray-50 text-gray-600 border-gray-200' },
  requires_capture: { label: 'Uncaptured', class: 'bg-purple-50 text-purple-700 border-purple-200' },
}

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { label: status, class: 'bg-gray-50 text-gray-600 border-gray-200' }
}

const availableBalance = computed(() => {
  if (!balance.value) return 0
  const usd = balance.value.available.find((a) => a.currency === 'usd')
  return usd?.amount ?? 0
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const [paymentsRes, balanceRes] = await Promise.all([
      paymentsApi.list({ limit: 5 }),
      balanceApi.get(),
    ])
    recentPayments.value = paymentsRes.data
    balance.value = balanceRes
  } catch (err) {
    console.error('Failed to load home page data', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header greeting -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Good morning, My Stripe Account</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Here's what's happening with your business today.</p>
      </div>
      <Button as-child>
        <RouterLink to="/payments">
          <CreditCard class="h-4 w-4" />
          View payments
        </RouterLink>
      </Button>
    </div>

    <!-- Metric cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Today's volume -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Today's volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">
            <template v-if="loading"><Skeleton class="h-7 w-24" /></template>
            <template v-else>{{ formatCurrency(availableBalance) }}</template>
          </div>
          <p class="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingDown class="h-3 w-3 text-red-500" />
            vs yesterday $0.00
          </p>
        </CardContent>
      </Card>

      <!-- Gross volume -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Gross volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">$1,250.00</div>
          <p class="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp class="h-3 w-3 text-green-500" />
            this week
          </p>
        </CardContent>
      </Card>

      <!-- Net revenue -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Net revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">$1,180.00</div>
          <p class="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp class="h-3 w-3 text-green-500" />
            after fees &amp; refunds
          </p>
        </CardContent>
      </Card>

      <!-- New customers -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">New customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-semibold text-foreground">3</div>
          <p class="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Users class="h-3 w-3" />
            today
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Chart -->
    <Card>
      <CardHeader class="pb-2">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-semibold">Payment volume</CardTitle>
          <span class="text-xs text-muted-foreground">Last 7 days</span>
        </div>
      </CardHeader>
      <CardContent>
        <div class="h-52">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </CardContent>
    </Card>

    <!-- Recent payments + Quick links -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Recent payments -->
      <div class="lg:col-span-2">
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <CardTitle class="text-base font-semibold">Recent payments</CardTitle>
              <Button variant="ghost" size="sm" as-child>
                <RouterLink to="/payments" class="flex items-center gap-1 text-xs">
                  View all <ArrowRight class="h-3 w-3" />
                </RouterLink>
              </Button>
            </div>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-if="loading">
                  <TableRow v-for="i in 5" :key="i">
                    <TableCell><Skeleton class="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton class="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton class="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton class="h-4 w-28" /></TableCell>
                  </TableRow>
                </template>
                <template v-else-if="recentPayments.length === 0">
                  <TableRow>
                    <TableCell colspan="4" class="text-center text-sm text-muted-foreground py-8">
                      No payments yet
                    </TableCell>
                  </TableRow>
                </template>
                <template v-else>
                  <TableRow
                    v-for="payment in recentPayments"
                    :key="payment.id"
                    class="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <RouterLink :to="`/payments/${payment.id}`" class="block font-medium text-foreground hover:text-blue-600">
                        {{ formatCurrency(payment.amount, payment.currency) }}
                      </RouterLink>
                    </TableCell>
                    <TableCell class="text-muted-foreground text-sm">
                      {{ payment.customer ?? payment.receipt_email ?? '—' }}
                    </TableCell>
                    <TableCell>
                      <span
                        class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                        :class="getStatusConfig(payment.status).class"
                      >
                        {{ getStatusConfig(payment.status).label }}
                      </span>
                    </TableCell>
                    <TableCell class="text-muted-foreground text-sm whitespace-nowrap">
                      {{ formatDate(payment.created) }}
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <!-- Quick links -->
      <div>
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base font-semibold">Quick actions</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button variant="outline" class="w-full justify-start gap-3 h-10" as-child>
              <RouterLink to="/payments">
                <span class="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Plus class="h-3.5 w-3.5" />
                </span>
                Create a payment
              </RouterLink>
            </Button>
            <Button variant="outline" class="w-full justify-start gap-3 h-10" as-child>
              <RouterLink to="/customers">
                <span class="flex h-6 w-6 items-center justify-center rounded-md bg-green-50 text-green-600">
                  <UserPlus class="h-3.5 w-3.5" />
                </span>
                Add a customer
              </RouterLink>
            </Button>
            <Button variant="outline" class="w-full justify-start gap-3 h-10" as-child>
              <RouterLink to="/subscriptions">
                <span class="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                  <RefreshCw class="h-3.5 w-3.5" />
                </span>
                Create a subscription
              </RouterLink>
            </Button>
            <Button variant="outline" class="w-full justify-start gap-3 h-10" as-child>
              <RouterLink to="/payment-links">
                <span class="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <CreditCard class="h-3.5 w-3.5" />
                </span>
                Create payment link
              </RouterLink>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
