<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { subscriptionsApi, customersApi, type Subscription, type Customer } from '@/lib/api'

type TabValue = 'all' | 'active' | 'trialing' | 'past_due' | 'canceled'

const subscriptions = ref<Subscription[]>([])
const customerMap = ref<Record<string, Customer>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<TabValue>('all')

onMounted(async () => {
  try {
    const res = await subscriptionsApi.list({ limit: 100 })
    subscriptions.value = res.data

    // Fetch customers for display names
    const uniqueCustomerIds = [...new Set(res.data.map(s => s.customer).filter(Boolean))]
    await Promise.all(
      uniqueCustomerIds.map(async (id) => {
        try {
          const c = await customersApi.get(id)
          customerMap.value[id] = c
        } catch {
          // ignore
        }
      })
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load subscriptions'
  } finally {
    loading.value = false
  }
})

const filteredSubscriptions = computed(() => {
  if (activeTab.value === 'all') return subscriptions.value
  return subscriptions.value.filter(s => s.status === activeTab.value)
})

const tabCounts = computed(() => ({
  all: subscriptions.value.length,
  active: subscriptions.value.filter(s => s.status === 'active').length,
  trialing: subscriptions.value.filter(s => s.status === 'trialing').length,
  past_due: subscriptions.value.filter(s => s.status === 'past_due').length,
  canceled: subscriptions.value.filter(s => s.status === 'canceled').length,
}))

function getCustomerDisplay(customerId: string): string {
  const c = customerMap.value[customerId]
  if (!c) return customerId
  return c.name || c.email || customerId
}

function getPlanDisplay(sub: Subscription): string {
  const item = sub.items.data[0]
  if (!item) return '—'
  const price = item.price
  const amount = price.unit_amount != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency }).format(price.unit_amount / 100)
    : '—'
  const interval = price.recurring ? `/${price.recurring.interval}` : ''
  const nickname = price.nickname || 'Plan'
  return `${nickname} • ${amount}${interval}`
}

function formatAmount(sub: Subscription): string {
  const item = sub.items.data[0]
  if (!item || item.price.unit_amount == null) return '—'
  const total = item.price.unit_amount * (item.quantity || 1)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: item.price.currency,
  }).format(total / 100)
}

function formatInterval(sub: Subscription): string {
  const item = sub.items.data[0]
  if (!item?.price.recurring) return ''
  const { interval, interval_count } = item.price.recurring
  if (interval_count === 1) return `/ ${interval}`
  return `/ ${interval_count} ${interval}s`
}

function formatDateShort(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

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
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-semibold text-foreground">Subscriptions</h1>
        <Tabs v-model="activeTab">
          <TabsList class="h-8">
            <TabsTrigger value="all" class="text-xs px-3">
              All
              <span class="ml-1 text-muted-foreground">({{ tabCounts.all }})</span>
            </TabsTrigger>
            <TabsTrigger value="active" class="text-xs px-3">Active</TabsTrigger>
            <TabsTrigger value="trialing" class="text-xs px-3">Trialing</TabsTrigger>
            <TabsTrigger value="past_due" class="text-xs px-3">Past due</TabsTrigger>
            <TabsTrigger value="canceled" class="text-xs px-3">Canceled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Table -->
    <div class="rounded-md border border-border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b border-border">
            <TableHead class="text-xs font-medium text-muted-foreground">Customer</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Plan / Price</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Status</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Amount</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Current period</TableHead>
            <TableHead class="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading -->
          <template v-if="loading">
            <TableRow v-for="i in 5" :key="i" class="hover:bg-muted/30">
              <TableCell><Skeleton class="h-4 w-32" /></TableCell>
              <TableCell><Skeleton class="h-4 w-48" /></TableCell>
              <TableCell><Skeleton class="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton class="h-4 w-20" /></TableCell>
              <TableCell><Skeleton class="h-4 w-40" /></TableCell>
              <TableCell />
            </TableRow>
          </template>

          <!-- Empty -->
          <TableRow v-else-if="filteredSubscriptions.length === 0">
            <TableCell colspan="6" class="h-32 text-center text-sm text-muted-foreground">
              No subscriptions found.
            </TableCell>
          </TableRow>

          <!-- Data -->
          <TableRow
            v-else
            v-for="sub in filteredSubscriptions"
            :key="sub.id"
            class="hover:bg-muted/30 cursor-pointer"
          >
            <TableCell>
              <RouterLink
                :to="`/customers/${sub.customer}`"
                class="text-sm font-medium text-blue-600 hover:underline"
                @click.stop
              >
                {{ getCustomerDisplay(sub.customer) }}
              </RouterLink>
              <p class="text-xs text-muted-foreground font-mono mt-0.5">{{ sub.customer }}</p>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/subscriptions/${sub.id}`" class="block">
                <p class="text-sm text-foreground">{{ getPlanDisplay(sub) }}</p>
                <p class="text-xs text-muted-foreground font-mono mt-0.5">{{ sub.id }}</p>
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/subscriptions/${sub.id}`" class="block">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    getStatusBadgeClass(sub.status)
                  ]"
                >
                  {{ getStatusLabel(sub.status) }}
                </span>
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/subscriptions/${sub.id}`" class="block">
                <span class="text-sm font-medium text-foreground">{{ formatAmount(sub) }}</span>
                <span class="text-xs text-muted-foreground ml-1">{{ formatInterval(sub) }}</span>
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/subscriptions/${sub.id}`" class="block text-sm text-muted-foreground">
                {{ formatDateShort(sub.current_period_start) }} – {{ formatDateShort(sub.current_period_end) }}
              </RouterLink>
            </TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon-sm" class="h-7 w-7 text-muted-foreground">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem as-child>
                    <RouterLink :to="`/subscriptions/${sub.id}`">View details</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Copy ID</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive">Cancel subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
