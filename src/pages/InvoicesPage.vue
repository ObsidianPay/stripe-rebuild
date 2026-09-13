<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, MoreHorizontal } from 'lucide-vue-next'
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
import { invoicesApi, customersApi, type Invoice, type Customer } from '@/lib/api'

type TabValue = 'all' | 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

const invoices = ref<Invoice[]>([])
const customerMap = ref<Record<string, Customer>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<TabValue>('all')

onMounted(async () => {
  try {
    const res = await invoicesApi.list({ limit: 100 })
    invoices.value = res.data

    const uniqueCustomerIds = [...new Set(
      res.data.map(i => i.customer).filter((id): id is string => !!id)
    )]
    await Promise.all(
      uniqueCustomerIds.map(async (id) => {
        try {
          customerMap.value[id] = await customersApi.get(id)
        } catch { /* ignore */ }
      })
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load invoices'
  } finally {
    loading.value = false
  }
})

const filteredInvoices = computed(() => {
  if (activeTab.value === 'all') return invoices.value
  return invoices.value.filter(i => i.status === activeTab.value)
})

const tabCounts = computed(() => ({
  all: invoices.value.length,
  draft: invoices.value.filter(i => i.status === 'draft').length,
  open: invoices.value.filter(i => i.status === 'open').length,
  paid: invoices.value.filter(i => i.status === 'paid').length,
  void: invoices.value.filter(i => i.status === 'void').length,
  uncollectible: invoices.value.filter(i => i.status === 'uncollectible').length,
}))

function getCustomerDisplay(customerId: string | null): string {
  if (!customerId) return '—'
  const c = customerMap.value[customerId]
  if (!c) return customerId
  return c.name || c.email || customerId
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

function getStatusBadgeClass(status: Invoice['status']): string {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700 border border-green-200'
    case 'open': return 'bg-blue-100 text-blue-700 border border-blue-200'
    case 'draft': return 'bg-gray-100 text-gray-500 border border-gray-200'
    case 'void': return 'bg-red-100 text-red-700 border border-red-200'
    case 'uncollectible': return 'bg-orange-100 text-orange-700 border border-orange-200'
    default: return 'bg-gray-100 text-gray-500 border border-gray-200'
  }
}

function getStatusLabel(status: Invoice['status']): string {
  switch (status) {
    case 'paid': return 'Paid'
    case 'open': return 'Open'
    case 'draft': return 'Draft'
    case 'void': return 'Void'
    case 'uncollectible': return 'Uncollectible'
    default: return status
  }
}

function formatInvoiceNumber(inv: Invoice): string {
  return inv.number || `IN-${inv.id.slice(-6).toUpperCase()}`
}
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-semibold text-foreground">Invoices</h1>
        <Tabs v-model="activeTab">
          <TabsList class="h-8">
            <TabsTrigger value="all" class="text-xs px-3">
              All
              <span class="ml-1 text-muted-foreground">({{ tabCounts.all }})</span>
            </TabsTrigger>
            <TabsTrigger value="draft" class="text-xs px-3">Draft</TabsTrigger>
            <TabsTrigger value="open" class="text-xs px-3">Open</TabsTrigger>
            <TabsTrigger value="paid" class="text-xs px-3">Paid</TabsTrigger>
            <TabsTrigger value="void" class="text-xs px-3">Void</TabsTrigger>
            <TabsTrigger value="uncollectible" class="text-xs px-3">Uncollectible</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Button size="sm" class="gap-1.5 text-xs">
        <Plus class="h-3.5 w-3.5" />
        Create invoice
      </Button>
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
            <TableHead class="text-xs font-medium text-muted-foreground">Invoice #</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Customer</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Amount</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Status</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Due date</TableHead>
            <TableHead class="text-xs font-medium text-muted-foreground">Created</TableHead>
            <TableHead class="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading -->
          <template v-if="loading">
            <TableRow v-for="i in 5" :key="i" class="hover:bg-muted/30">
              <TableCell><Skeleton class="h-4 w-24" /></TableCell>
              <TableCell><Skeleton class="h-4 w-32" /></TableCell>
              <TableCell><Skeleton class="h-4 w-20" /></TableCell>
              <TableCell><Skeleton class="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton class="h-4 w-24" /></TableCell>
              <TableCell><Skeleton class="h-4 w-24" /></TableCell>
              <TableCell />
            </TableRow>
          </template>

          <!-- Empty -->
          <TableRow v-else-if="filteredInvoices.length === 0">
            <TableCell colspan="7" class="h-32 text-center text-sm text-muted-foreground">
              No invoices found.
            </TableCell>
          </TableRow>

          <!-- Data -->
          <TableRow
            v-else
            v-for="inv in filteredInvoices"
            :key="inv.id"
            class="hover:bg-muted/30 cursor-pointer"
          >
            <TableCell>
              <RouterLink
                :to="`/invoices/${inv.id}`"
                class="text-sm font-medium text-blue-600 hover:underline font-mono"
              >
                {{ formatInvoiceNumber(inv) }}
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink
                v-if="inv.customer"
                :to="`/customers/${inv.customer}`"
                class="text-sm font-medium text-blue-600 hover:underline"
                @click.stop
              >
                {{ getCustomerDisplay(inv.customer) }}
              </RouterLink>
              <span v-else class="text-sm text-muted-foreground">—</span>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/invoices/${inv.id}`" class="block">
                <span class="text-sm font-medium text-foreground">
                  {{ formatAmount(inv.amount_due, inv.currency) }}
                </span>
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/invoices/${inv.id}`" class="block">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    getStatusBadgeClass(inv.status)
                  ]"
                >
                  {{ getStatusLabel(inv.status) }}
                </span>
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/invoices/${inv.id}`" class="block text-sm text-muted-foreground">
                {{ inv.due_date ? formatDate(inv.due_date) : '—' }}
              </RouterLink>
            </TableCell>
            <TableCell>
              <RouterLink :to="`/invoices/${inv.id}`" class="block text-sm text-muted-foreground">
                {{ formatDate(inv.created) }}
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
                    <RouterLink :to="`/invoices/${inv.id}`">View invoice</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Copy ID</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Send invoice</DropdownMenuItem>
                  <DropdownMenuItem>Mark as paid</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive">Void invoice</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
