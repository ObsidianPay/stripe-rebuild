<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Download,
  Plus,
  ChevronDown,
  Filter,
  MoreHorizontal,
  CreditCard,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { paymentsApi, type PaymentIntent } from '@/lib/api'

type StatusFilter = 'all' | 'succeeded' | 'refunded' | 'requires_capture'

const payments = ref<PaymentIntent[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<StatusFilter>('all')
const selectedIds = ref<Set<string>>(new Set())

onMounted(async () => {
  try {
    const res = await paymentsApi.list({ limit: 100 })
    payments.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load payments'
  } finally {
    loading.value = false
  }
})

const filteredPayments = computed(() => {
  if (activeTab.value === 'all') return payments.value
  if (activeTab.value === 'succeeded') return payments.value.filter(p => p.status === 'succeeded')
  if (activeTab.value === 'refunded') return payments.value.filter(p => p.status === 'canceled')
  if (activeTab.value === 'requires_capture') return payments.value.filter(p => p.status === 'requires_capture')
  return payments.value
})

const allSelected = computed(() =>
  filteredPayments.value.length > 0 &&
  filteredPayments.value.every(p => selectedIds.value.has(p.id))
)

function toggleAll() {
  if (allSelected.value) {
    filteredPayments.value.forEach(p => selectedIds.value.delete(p.id))
  } else {
    filteredPayments.value.forEach(p => selectedIds.value.add(p.id))
  }
}

function toggleRow(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function formatAmount(amount: number, currency: string): { value: string; currency: string } {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100)
  return { value: `$${formatted}`, currency: currency.toUpperCase() }
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

const tabCounts = computed(() => ({
  all: payments.value.length,
  succeeded: payments.value.filter(p => p.status === 'succeeded').length,
  refunded: payments.value.filter(p => p.status === 'canceled').length,
  requires_capture: payments.value.filter(p => p.status === 'requires_capture').length,
}))
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-semibold text-foreground">Payments</h1>
        <Tabs v-model="activeTab">
          <TabsList class="h-8">
            <TabsTrigger value="all" class="text-xs px-3">
              All
              <span class="ml-1 text-muted-foreground">({{ tabCounts.all }})</span>
            </TabsTrigger>
            <TabsTrigger value="succeeded" class="text-xs px-3">Successful</TabsTrigger>
            <TabsTrigger value="refunded" class="text-xs px-3">Refunded</TabsTrigger>
            <TabsTrigger value="requires_capture" class="text-xs px-3">Uncaptured</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="gap-1.5 text-xs">
          <Download class="h-3.5 w-3.5" />
          Export
        </Button>
        <Button size="sm" class="gap-1.5 text-xs">
          <Plus class="h-3.5 w-3.5" />
          Create payment
        </Button>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" class="gap-1.5 text-xs text-muted-foreground">
        Last 7 days
        <ChevronDown class="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="sm" class="gap-1.5 text-xs text-muted-foreground">
        Amount
        <ChevronDown class="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="gap-1.5 text-xs text-muted-foreground">
            Status
            <ChevronDown class="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>All statuses</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Succeeded</DropdownMenuItem>
          <DropdownMenuItem>Processing</DropdownMenuItem>
          <DropdownMenuItem>Failed</DropdownMenuItem>
          <DropdownMenuItem>Requires action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" class="gap-1.5 text-xs text-muted-foreground">
        <Filter class="h-3.5 w-3.5" />
        More filters
      </Button>
    </div>

    <!-- Error state -->
    <div v-if="error" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Table -->
    <div class="rounded-md border border-border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b border-border">
            <TableHead class="w-10 pl-4">
              <Checkbox
                :checked="allSelected"
                @update:checked="toggleAll"
                :disabled="loading || filteredPayments.length === 0"
              />
            </TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Amount</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Payment method</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Description</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Customer</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Date</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Status</TableHead>
            <TableHead class="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading skeletons -->
          <template v-if="loading">
            <TableRow v-for="i in 5" :key="i" class="hover:bg-muted/30">
              <TableCell class="pl-4"><Skeleton class="h-4 w-4" /></TableCell>
              <TableCell><Skeleton class="h-4 w-20" /></TableCell>
              <TableCell><Skeleton class="h-4 w-28" /></TableCell>
              <TableCell><Skeleton class="h-4 w-36" /></TableCell>
              <TableCell><Skeleton class="h-4 w-24" /></TableCell>
              <TableCell><Skeleton class="h-4 w-32" /></TableCell>
              <TableCell><Skeleton class="h-5 w-20 rounded-full" /></TableCell>
              <TableCell />
            </TableRow>
          </template>

          <!-- Empty state -->
          <TableRow v-else-if="filteredPayments.length === 0">
            <TableCell colspan="8" class="h-32 text-center text-sm text-muted-foreground">
              No payments found.
            </TableCell>
          </TableRow>

          <!-- Data rows -->
          <TableRow
            v-else
            v-for="payment in filteredPayments"
            :key="payment.id"
            class="hover:bg-muted/30 cursor-pointer"
          >
            <TableCell class="pl-4" @click.stop>
              <Checkbox
                :checked="selectedIds.has(payment.id)"
                @update:checked="() => toggleRow(payment.id)"
              />
            </TableCell>
            <TableCell>
              <RouterLink :to="`/payments/${payment.id}`" class="block">
                <span class="font-semibold text-sm text-foreground">
                  {{ formatAmount(payment.amount, payment.currency).value }}
                </span>
                <span class="ml-1 text-xs text-muted-foreground">
                  {{ formatAmount(payment.amount, payment.currency).currency }}
                </span>
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/payments/${payment.id}`" class="flex items-center gap-1.5">
                <CreditCard class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span class="text-sm text-foreground">
                  {{ payment.payment_method ? `•••• ${payment.payment_method.slice(-4)}` : '—' }}
                </span>
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/payments/${payment.id}`" class="block text-sm text-muted-foreground truncate max-w-[200px]">
                {{ payment.description || '—' }}
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink
                v-if="payment.customer"
                :to="`/customers/${payment.customer}`"
                class="text-sm text-blue-600 hover:underline"
                @click.stop
              >
                {{ payment.customer }}
              </RouterLink>
              <span v-else class="text-sm text-muted-foreground">—</span>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/payments/${payment.id}`" class="block text-sm text-muted-foreground whitespace-nowrap">
                {{ formatDate(payment.created) }}
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/payments/${payment.id}`" class="block">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 font-medium',
                    getStatusBadgeClass(payment.status)
                  ]"
                >
                  {{ getStatusLabel(payment.status) }}
                </span>
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
                    <RouterLink :to="`/payments/${payment.id}`">View details</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Copy ID</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive">Refund payment</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
