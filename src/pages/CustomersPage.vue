<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { customersApi, type Customer } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Search, Plus, MoreHorizontal } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

// ── State ────────────────────────────────────────────────────────────────────

const customers = ref<Customer[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const filterStatus = ref<'all' | 'active'>('all')

// ── Data fetching ─────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const res = await customersApi.list({ limit: 100 })
    customers.value = res.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load customers'
  } finally {
    loading.value = false
  }
})

// ── Computed ──────────────────────────────────────────────────────────────────

const filteredCustomers = computed(() => {
  let list = customers.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (c) =>
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    )
  }
  if (filterStatus.value === 'active') {
    list = list.filter((c) => !c.delinquent)
  }
  return list
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function customerDisplayName(c: Customer): string {
  return c.name ?? c.email ?? c.id
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-foreground">Customers</h1>
      <Button size="sm">
        <Plus class="size-4" />
        Add customer
      </Button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search customers…"
          class="pl-8"
        />
      </div>

      <!-- Filter tabs -->
      <div class="flex items-center gap-1 rounded-md border bg-muted p-0.5 text-sm">
        <button
          class="rounded px-3 py-1 font-medium transition-colors"
          :class="filterStatus === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="filterStatus = 'all'"
        >
          All
        </button>
        <button
          class="rounded px-3 py-1 font-medium transition-colors"
          :class="filterStatus === 'active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="filterStatus = 'active'"
        >
          Active
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Table -->
    <div class="rounded-lg border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[280px]">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created</TableHead>
            <TableHead class="text-right">Balance</TableHead>
            <TableHead class="w-[60px]" />
          </TableRow>
        </TableHeader>

        <TableBody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <TableRow v-for="i in 8" :key="i">
              <TableCell>
                <div class="flex items-center gap-3">
                  <Skeleton class="size-8 rounded-full" />
                  <Skeleton class="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell><Skeleton class="h-4 w-44" /></TableCell>
              <TableCell><Skeleton class="h-4 w-24" /></TableCell>
              <TableCell class="text-right"><Skeleton class="h-4 w-16 ml-auto" /></TableCell>
              <TableCell />
            </TableRow>
          </template>

          <!-- Empty state -->
          <template v-else-if="filteredCustomers.length === 0">
            <TableRow>
              <TableCell colspan="5" class="py-12 text-center">
                <div class="flex flex-col items-center gap-2">
                  <div class="text-muted-foreground text-sm">
                    {{ searchQuery ? 'No customers match your search.' : 'No customers yet.' }}
                  </div>
                  <Button v-if="!searchQuery" variant="outline" size="sm">
                    <Plus class="size-4" />
                    Add your first customer
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <!-- Data rows -->
          <template v-else>
            <TableRow
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="cursor-pointer hover:bg-muted/40"
            >
              <TableCell>
                <RouterLink
                  :to="`/customers/${customer.id}`"
                  class="flex items-center gap-3 no-underline"
                >
                  <!-- Avatar -->
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {{ getInitials(customer.name) }}
                  </div>
                  <span class="font-medium text-foreground">
                    {{ customerDisplayName(customer) }}
                  </span>
                </RouterLink>
              </TableCell>

              <TableCell class="text-muted-foreground text-sm">
                {{ customer.email ?? '—' }}
              </TableCell>

              <TableCell class="text-muted-foreground text-sm">
                {{ formatDate(customer.created) }}
              </TableCell>

              <TableCell class="text-right">
                <span
                  v-if="customer.balance !== 0"
                  :class="customer.balance < 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'"
                >
                  {{ formatCurrency(Math.abs(customer.balance), customer.currency ?? 'usd') }}
                </span>
                <span v-else class="text-muted-foreground text-sm">$0.00</span>
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="size-8">
                      <MoreHorizontal class="size-4" />
                      <span class="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem as-child>
                      <RouterLink :to="`/customers/${customer.id}`">View customer</RouterLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit customer</DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive focus:text-destructive">
                      Delete customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Footer count -->
    <div v-if="!loading && filteredCustomers.length > 0" class="text-sm text-muted-foreground">
      Showing {{ filteredCustomers.length }} customer{{ filteredCustomers.length === 1 ? '' : 's' }}
    </div>
  </div>
</template>
