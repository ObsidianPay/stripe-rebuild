<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  DollarSign,
  List,
  Receipt,
  ChevronDown,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { paymentsApi, customersApi, balanceApi } from '@/lib/api'
import type { PaymentIntent, BalanceTransaction, Customer } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend)

// ─── State ────────────────────────────────────────────────────────────────────

const selectedRange = ref('Last 30 days')

const dateRanges = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 12 months', 'Year to date']

// ─── Report categories ────────────────────────────────────────────────────────

const reportCategories = [
  {
    id: 'revenue',
    icon: TrendingUp,
    title: 'Revenue',
    description: 'Revenue and refunds over time',
    iconClass: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'payout',
    icon: DollarSign,
    title: 'Payout reconciliation',
    description: 'Reconcile payouts with transactions',
    iconClass: 'text-green-600 bg-green-50',
  },
  {
    id: 'transactions',
    icon: List,
    title: 'Itemized transactions',
    description: 'All transactions with details',
    iconClass: 'text-purple-600 bg-purple-50',
  },
  {
    id: 'tax',
    icon: Receipt,
    title: 'Tax summary',
    description: 'Tax collected by jurisdiction',
    iconClass: 'text-amber-600 bg-amber-50',
  },
]

// ─── Chart ────────────────────────────────────────────────────────────────────

const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthlyRevenue = [2400, 3100, 2800, 4200, 3800, 5100, 4600, 5400, 4900, 6200, 5800, 7100]

const chartData = computed(() => ({
  labels: monthlyLabels,
  datasets: [
    {
      label: 'Gross revenue',
      data: monthlyRevenue,
      backgroundColor: 'rgb(99, 102, 241)',
      borderRadius: 4,
      borderSkipped: false,
      hoverBackgroundColor: 'rgb(79, 82, 221)',
    },
    {
      label: 'Net revenue',
      data: monthlyRevenue.map((v) => Math.round(v * 0.95)),
      backgroundColor: 'rgb(167, 243, 208)',
      borderRadius: 4,
      borderSkipped: false,
      hoverBackgroundColor: 'rgb(134, 239, 172)',
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        boxWidth: 12,
        boxHeight: 12,
        font: { size: 12 },
        color: '#6b7280',
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
          `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString()}`,
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
      grid: { color: '#f3f4f6' },
      border: { display: false, dash: [4, 4] },
      ticks: {
        color: '#6b7280',
        font: { size: 12 },
        callback: (value: unknown) => `$${Number(value).toLocaleString()}`,
      },
    },
  },
}))

// ─── Metrics ──────────────────────────────────────────────────────────────────

const totalRevenue = computed(() =>
  monthlyRevenue.reduce((a, b) => a + b, 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  }),
)

// ─── CSV Export ───────────────────────────────────────────────────────────────

const exportLoading = ref<string | null>(null)

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const content = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function exportTransactions() {
  exportLoading.value = 'transactions'
  try {
    const result = await paymentsApi.list({ limit: 100 })
    const rows = result.data.map((p: PaymentIntent) => [
      p.id,
      String(p.amount / 100),
      p.currency,
      p.status,
      p.description ?? '',
      formatDate(p.created),
    ])
    downloadCsv('transactions.csv', ['ID', 'Amount', 'Currency', 'Status', 'Description', 'Date'], rows)
  } finally {
    exportLoading.value = null
  }
}

async function exportPayouts() {
  exportLoading.value = 'payouts'
  try {
    const result = await balanceApi.getHistory()
    const rows = result.data.map((t: BalanceTransaction) => [
      t.id,
      t.type,
      String(t.amount / 100),
      t.currency,
      t.description ?? '',
      formatDate(t.created),
    ])
    downloadCsv('payouts.csv', ['ID', 'Type', 'Amount', 'Currency', 'Description', 'Date'], rows)
  } finally {
    exportLoading.value = null
  }
}

async function exportCustomers() {
  exportLoading.value = 'customers'
  try {
    const result = await customersApi.list({ limit: 100 })
    const rows = result.data.map((c: Customer) => [
      c.id,
      c.name ?? '',
      c.email ?? '',
      c.phone ?? '',
      formatDate(c.created),
    ])
    downloadCsv('customers.csv', ['ID', 'Name', 'Email', 'Phone', 'Created'], rows)
  } finally {
    exportLoading.value = null
  }
}

// ─── View report ──────────────────────────────────────────────────────────────

const activeReport = ref<string | null>(null)
const reportPayments = ref<PaymentIntent[]>([])
const reportPayouts = ref<BalanceTransaction[]>([])

const taxRows = [
  { state: 'California', rate: '8.5%', collected: '$312.40' },
  { state: 'New York', rate: '8.875%', collected: '$187.20' },
  { state: 'Texas', rate: '6.25%', collected: '$89.40' },
  { state: 'Washington', rate: '10.25%', collected: '$156.80' },
]

watch(activeReport, async (id) => {
  if (id === 'transactions') {
    try {
      const result = await paymentsApi.list({ limit: 20 })
      reportPayments.value = result.data
    } catch {
      reportPayments.value = []
    }
  } else if (id === 'payout') {
    try {
      const result = await balanceApi.getHistory()
      reportPayouts.value = result.data
    } catch {
      reportPayouts.value = []
    }
  }
})
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Reports</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Analyze your business performance with detailed reports.
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="gap-1.5">
            {{ selectedRange }}
            <ChevronDown class="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuItem
            v-for="range in dateRanges"
            :key="range"
            :class="selectedRange === range ? 'bg-muted font-medium' : ''"
            @click="selectedRange = range"
          >
            {{ range }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Report category cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        v-for="report in reportCategories"
        :key="report.id"
        class="hover:shadow-md transition-shadow cursor-pointer group"
        :class="activeReport === report.id ? 'ring-2 ring-blue-500' : ''"
        @click="activeReport = activeReport === report.id ? null : report.id"
      >
        <CardHeader class="pb-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg mb-2"
            :class="report.iconClass"
          >
            <component :is="report.icon" class="h-5 w-5" />
          </div>
          <CardTitle class="text-sm font-semibold">{{ report.title }}</CardTitle>
          <CardDescription class="text-xs">{{ report.description }}</CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
          <Button
            variant="ghost"
            size="sm"
            class="gap-1 text-xs px-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent group-hover:underline"
          >
            View report
            <ArrowRight class="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Active report detail table -->
    <Card v-if="activeReport !== null">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-semibold">
            <span v-if="activeReport === 'revenue'">Monthly Revenue Breakdown</span>
            <span v-else-if="activeReport === 'payout'">Balance History</span>
            <span v-else-if="activeReport === 'transactions'">Recent Transactions</span>
            <span v-else-if="activeReport === 'tax'">Tax by Jurisdiction</span>
          </CardTitle>
          <Button variant="ghost" size="sm" class="h-7 w-7 p-0" @click="activeReport = null">
            <X class="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>

        <!-- Revenue breakdown -->
        <div v-if="activeReport === 'revenue'" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">Month</th>
                <th class="text-right pb-2.5 text-xs font-medium text-muted-foreground">Gross</th>
                <th class="text-right pb-2.5 text-xs font-medium text-muted-foreground">Fees (5%)</th>
                <th class="text-right pb-2.5 text-xs font-medium text-muted-foreground">Net</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(gross, i) in monthlyRevenue"
                :key="i"
                class="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td class="py-2.5 text-foreground">{{ monthlyLabels[i] }}</td>
                <td class="py-2.5 text-right text-foreground">${{ gross.toLocaleString() }}</td>
                <td class="py-2.5 text-right text-muted-foreground">${{ Math.round(gross * 0.05).toLocaleString() }}</td>
                <td class="py-2.5 text-right text-foreground">${{ Math.round(gross * 0.95).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Balance / payout history -->
        <div v-else-if="activeReport === 'payout'" class="overflow-x-auto">
          <div v-if="reportPayouts.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            No payout history available.
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">Date</th>
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">Description</th>
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">Type</th>
                <th class="text-right pb-2.5 text-xs font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="txn in reportPayouts"
                :key="txn.id"
                class="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td class="py-2.5 text-foreground whitespace-nowrap">{{ formatDate(txn.created) }}</td>
                <td class="py-2.5 text-muted-foreground max-w-xs truncate">{{ txn.description ?? '—' }}</td>
                <td class="py-2.5 text-muted-foreground capitalize">{{ txn.type }}</td>
                <td class="py-2.5 text-right text-foreground">{{ formatCurrency(txn.amount, txn.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent transactions -->
        <div v-else-if="activeReport === 'transactions'" class="overflow-x-auto">
          <div v-if="reportPayments.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            No transactions available.
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">ID</th>
                <th class="text-right pb-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="payment in reportPayments"
                :key="payment.id"
                class="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td class="py-2.5 font-mono text-xs text-muted-foreground">{{ payment.id }}</td>
                <td class="py-2.5 text-right text-foreground">{{ formatCurrency(payment.amount, payment.currency) }}</td>
                <td class="py-2.5">
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="
                      payment.status === 'succeeded'
                        ? 'bg-green-100 text-green-700'
                        : payment.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    "
                  >
                    {{ payment.status }}
                  </span>
                </td>
                <td class="py-2.5 text-muted-foreground whitespace-nowrap">{{ formatDate(payment.created) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tax by jurisdiction -->
        <div v-else-if="activeReport === 'tax'" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left pb-2.5 text-xs font-medium text-muted-foreground">State</th>
                <th class="text-right pb-2.5 text-xs font-medium text-muted-foreground">Rate</th>
                <th class="text-right pb-2.5 text-xs font-medium text-muted-foreground">Collected</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in taxRows"
                :key="row.state"
                class="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td class="py-2.5 text-foreground">{{ row.state }}</td>
                <td class="py-2.5 text-right text-muted-foreground">{{ row.rate }}</td>
                <td class="py-2.5 text-right text-foreground">{{ row.collected }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>

    <!-- Revenue chart -->
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-start justify-between">
          <div>
            <CardTitle class="text-base font-semibold">Monthly revenue</CardTitle>
            <CardDescription class="text-sm mt-0.5">
              Gross vs net revenue for the current year
            </CardDescription>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">Total gross (YTD)</p>
            <p class="text-lg font-semibold text-foreground">{{ totalRevenue }}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="h-64">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </CardContent>
    </Card>

    <!-- Quick export section -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-base font-semibold">Export data</CardTitle>
        <CardDescription>Download your data as CSV for external analysis.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          :disabled="exportLoading !== null"
          class="gap-1.5"
          @click="exportTransactions"
        >
          <Loader2 v-if="exportLoading === 'transactions'" class="h-4 w-4 animate-spin" />
          <Receipt v-else class="h-4 w-4" />
          Export transactions
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="exportLoading !== null"
          class="gap-1.5"
          @click="exportPayouts"
        >
          <Loader2 v-if="exportLoading === 'payouts'" class="h-4 w-4 animate-spin" />
          <DollarSign v-else class="h-4 w-4" />
          Export payouts
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="exportLoading !== null"
          class="gap-1.5"
          @click="exportCustomers"
        >
          <Loader2 v-if="exportLoading === 'customers'" class="h-4 w-4 animate-spin" />
          <List v-else class="h-4 w-4" />
          Export customers
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
