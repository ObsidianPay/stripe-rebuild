<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Banknote,
  ArrowDownToLine,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  DollarSign,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Separator } from '@/components/ui/separator'
import { balanceApi } from '@/lib/api'
import type { Balance, BalanceTransaction } from '@/lib/api'

// ─── State ────────────────────────────────────────────────────────────────────

const loading = ref(true)
const historyLoading = ref(true)
const balance = ref<Balance | null>(null)
const history = ref<BalanceTransaction[]>([])

// ─── Computed ─────────────────────────────────────────────────────────────────

const availableUsd = computed(() => {
  if (!balance.value) return 0
  return balance.value.available.find((a) => a.currency === 'usd')?.amount ?? 0
})

const pendingUsd = computed(() => {
  if (!balance.value) return 0
  return balance.value.pending.find((p) => p.currency === 'usd')?.amount ?? 0
})

const totalGross = computed(() =>
  history.value.reduce((sum, t) => sum + t.amount, 0),
)
const totalFees = computed(() =>
  history.value.reduce((sum, t) => sum + t.fee, 0),
)
const totalNet = computed(() =>
  history.value.reduce((sum, t) => sum + t.net, 0),
)

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
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

const txTypeConfig: Record<string, { label: string; icon: unknown; class: string }> = {
  payment: { label: 'Payment', icon: ArrowDownLeft, class: 'text-green-600' },
  payout: { label: 'Payout', icon: ArrowUpRight, class: 'text-blue-600' },
  refund: { label: 'Refund', icon: RefreshCw, class: 'text-amber-600' },
  transfer: { label: 'Transfer', icon: TrendingUp, class: 'text-purple-600' },
  adjustment: { label: 'Adjustment', icon: DollarSign, class: 'text-gray-600' },
}

function getTxConfig(type: string) {
  return txTypeConfig[type] ?? { label: type, icon: DollarSign, class: 'text-gray-600' }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const [balanceRes, historyRes] = await Promise.all([
      balanceApi.get(),
      balanceApi.getHistory({ limit: 25 }),
    ])
    balance.value = balanceRes
    history.value = historyRes.data
  } catch (err) {
    console.error('Failed to load balance data', err)
  } finally {
    loading.value = false
    historyLoading.value = false
  }
})
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Balance</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Your Stripe balance and payout history.</p>
      </div>
    </div>

    <!-- Balance cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Available balance -->
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote class="h-4 w-4" />
              Available to pay out
            </CardTitle>
            <Badge variant="outline" class="text-xs border-green-200 bg-green-50 text-green-700">
              USD
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <template v-if="loading">
            <Skeleton class="h-8 w-32 mb-3" />
          </template>
          <template v-else>
            <p class="text-3xl font-semibold text-foreground mb-3">
              {{ formatCurrency(availableUsd) }}
            </p>
          </template>
          <Button size="sm" class="gap-2">
            <ArrowDownToLine class="h-3.5 w-3.5" />
            Pay out all funds
          </Button>
        </CardContent>
      </Card>

      <!-- In transit -->
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock class="h-4 w-4" />
              In transit to bank
            </CardTitle>
            <Badge variant="outline" class="text-xs text-muted-foreground">USD</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <template v-if="loading">
            <Skeleton class="h-8 w-32 mb-3" />
          </template>
          <template v-else>
            <p class="text-3xl font-semibold text-foreground mb-3">
              {{ formatCurrency(pendingUsd) }}
            </p>
          </template>
          <p class="text-xs text-muted-foreground">Typically arrives in 2 business days</p>
        </CardContent>
      </Card>
    </div>

    <!-- Balance summary -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-base font-semibold">Balance summary</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead class="text-right">Gross</TableHead>
              <TableHead class="text-right">Fees</TableHead>
              <TableHead class="text-right">Net</TableHead>
              <TableHead class="text-right">Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="loading">
              <TableRow>
                <TableCell colspan="5">
                  <Skeleton class="h-8 w-full" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow>
                <TableCell class="font-medium">USD</TableCell>
                <TableCell class="text-right text-sm">
                  {{ formatCurrency(totalGross) }}
                </TableCell>
                <TableCell class="text-right text-sm text-red-600">
                  -{{ formatCurrency(totalFees) }}
                </TableCell>
                <TableCell class="text-right text-sm font-medium">
                  {{ formatCurrency(totalNet) }}
                </TableCell>
                <TableCell class="text-right text-sm font-semibold text-green-700">
                  {{ formatCurrency(availableUsd) }}
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Balance history -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-base font-semibold">Balance history</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead class="text-right">Ending balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="historyLoading">
              <TableRow v-for="i in 6" :key="i">
                <TableCell><Skeleton class="h-4 w-24" /></TableCell>
                <TableCell><Skeleton class="h-4 w-48" /></TableCell>
                <TableCell><Skeleton class="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton class="h-4 w-20 ml-auto" /></TableCell>
              </TableRow>
            </template>
            <template v-else-if="history.length === 0">
              <TableRow>
                <TableCell colspan="4" class="text-center text-sm text-muted-foreground py-8">
                  No balance transactions yet
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow v-for="(tx, idx) in history" :key="tx.id">
                <TableCell class="text-sm text-muted-foreground whitespace-nowrap">
                  {{ formatDate(tx.created) }}
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <component
                      :is="getTxConfig(tx.type).icon"
                      class="h-4 w-4 shrink-0"
                      :class="getTxConfig(tx.type).class"
                    />
                    <div>
                      <p class="text-sm font-medium text-foreground">
                        {{ getTxConfig(tx.type).label }}
                      </p>
                      <p v-if="tx.description" class="text-xs text-muted-foreground line-clamp-1">
                        {{ tx.description }}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell
                  class="text-right text-sm font-medium whitespace-nowrap"
                  :class="tx.amount >= 0 ? 'text-foreground' : 'text-red-600'"
                >
                  {{ tx.amount >= 0 ? '+' : '' }}{{ formatCurrency(tx.amount, tx.currency) }}
                </TableCell>
                <TableCell class="text-right text-sm text-muted-foreground whitespace-nowrap">
                  <!-- Cumulative ending balance (running sum from latest down) -->
                  {{
                    formatCurrency(
                      history.slice(0, idx + 1).reduce((sum, t) => sum + t.net, 0),
                      tx.currency,
                    )
                  }}
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
