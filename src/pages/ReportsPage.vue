<script setup lang="ts">
import { ref, computed } from 'vue'
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
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
          <Button variant="ghost" size="sm" class="gap-1 text-xs px-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent group-hover:underline">
            View report
            <ArrowRight class="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </div>

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
        <Button variant="outline" size="sm">
          <Receipt class="h-4 w-4" />
          Export transactions
        </Button>
        <Button variant="outline" size="sm">
          <DollarSign class="h-4 w-4" />
          Export payouts
        </Button>
        <Button variant="outline" size="sm">
          <List class="h-4 w-4" />
          Export customers
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
