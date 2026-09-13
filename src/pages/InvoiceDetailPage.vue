<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Download,
  ChevronDown,
  User,
  CreditCard,
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
import { Separator } from '@/components/ui/separator'
import { invoicesApi, customersApi, type Invoice, type Customer } from '@/lib/api'

const route = useRoute()
const invoice = ref<Invoice | null>(null)
const customer = ref<Customer | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const actionLoading = ref<string | null>(null)

onMounted(async () => {
  const id = route.params.id as string
  try {
    invoice.value = await invoicesApi.get(id)
    if (invoice.value.customer) {
      try {
        customer.value = await customersApi.get(invoice.value.customer)
      } catch { /* ignore */ }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load invoice'
  } finally {
    loading.value = false
  }
})

async function sendInvoice() {
  if (!invoice.value || actionLoading.value) return
  actionLoading.value = 'send'
  try {
    invoice.value = await invoicesApi.send(invoice.value.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to send invoice'
  } finally {
    actionLoading.value = null
  }
}

async function markAsPaid() {
  if (!invoice.value || actionLoading.value) return
  actionLoading.value = 'pay'
  try {
    invoice.value = await invoicesApi.pay(invoice.value.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to mark as paid'
  } finally {
    actionLoading.value = null
  }
}

async function voidInvoice() {
  if (!invoice.value || actionLoading.value) return
  actionLoading.value = 'void'
  try {
    invoice.value = await invoicesApi.void(invoice.value.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to void invoice'
  } finally {
    actionLoading.value = null
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

function formatUnitAmount(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

const invoiceNumber = computed(() => {
  if (!invoice.value) return '—'
  return invoice.value.number || `IN-${invoice.value.id.slice(-6).toUpperCase()}`
})

const customerDisplay = computed(() => {
  if (customer.value) return customer.value.name || customer.value.email || customer.value.id
  return invoice.value?.customer || '—'
})

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

const lineItems = computed(() => invoice.value?.lines.data ?? [])

const subtotal = computed(() => {
  if (!invoice.value) return 0
  return lineItems.value.reduce((sum, item) => sum + item.amount, 0)
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Back link -->
    <RouterLink
      to="/invoices"
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft class="h-4 w-4" />
      Invoices
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
          <Skeleton class="h-5 w-32" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-8 w-20" />
          <Skeleton class="h-8 w-28" />
          <Skeleton class="h-8 w-16" />
          <Skeleton class="h-8 w-24" />
        </div>
      </div>
      <Skeleton class="h-64 w-full rounded-lg" />
      <Skeleton class="h-32 w-full rounded-lg" />
    </template>

    <!-- Content -->
    <template v-else-if="invoice">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="space-y-1.5">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-semibold text-foreground font-mono">{{ invoiceNumber }}</h1>
            <span class="text-lg text-muted-foreground font-sans font-normal">{{ customerDisplay }}</span>
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                getStatusBadgeClass(invoice.status)
              ]"
            >
              {{ getStatusLabel(invoice.status) }}
            </span>
          </div>
          <p class="text-3xl font-semibold text-foreground tracking-tight">
            {{ formatAmount(invoice.amount_due, invoice.currency) }}
            <span class="text-base text-muted-foreground font-normal ml-1">due</span>
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs"
            :disabled="invoice.status !== 'open' || actionLoading !== null"
            @click="sendInvoice"
          >
            <Send class="h-3.5 w-3.5" />
            {{ actionLoading === 'send' ? 'Sending…' : 'Send' }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs"
            :disabled="invoice.status === 'paid' || invoice.status === 'void' || actionLoading !== null"
            @click="markAsPaid"
          >
            <CheckCircle class="h-3.5 w-3.5" />
            {{ actionLoading === 'pay' ? 'Marking…' : 'Mark as paid' }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
            :disabled="invoice.status === 'void' || invoice.status === 'paid' || actionLoading !== null"
            @click="voidInvoice"
          >
            <XCircle class="h-3.5 w-3.5" />
            {{ actionLoading === 'void' ? 'Voiding…' : 'Void' }}
          </Button>
          <Button
            v-if="invoice.invoice_pdf"
            variant="outline"
            size="sm"
            class="gap-1.5 text-xs"
            as="a"
            :href="invoice.invoice_pdf"
            target="_blank"
            rel="noopener"
          >
            <Download class="h-3.5 w-3.5" />
            Download
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="gap-1.5 text-xs">
                More
                <ChevronDown class="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy invoice ID</DropdownMenuItem>
              <DropdownMenuItem v-if="invoice.hosted_invoice_url" as="a" :href="invoice.hosted_invoice_url" target="_blank">
                Open hosted invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Finalize invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Main content card -->
      <Card>
        <CardHeader class="pb-4 border-b border-border">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Invoice</p>
              <p class="text-xl font-semibold font-mono text-foreground">{{ invoiceNumber }}</p>
            </div>
            <div class="text-right space-y-1">
              <div>
                <span class="text-xs text-muted-foreground">Created: </span>
                <span class="text-sm text-foreground">{{ formatDate(invoice.created) }}</span>
              </div>
              <div v-if="invoice.due_date">
                <span class="text-xs text-muted-foreground">Due: </span>
                <span class="text-sm text-foreground">{{ formatDate(invoice.due_date) }}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <!-- Bill to -->
        <CardContent class="pt-5 pb-0">
          <div class="mb-6">
            <p class="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Bill to</p>
            <RouterLink
              v-if="invoice.customer"
              :to="`/customers/${invoice.customer}`"
              class="text-sm font-medium text-blue-600 hover:underline block"
            >
              {{ customerDisplay }}
            </RouterLink>
            <p v-if="customer?.email" class="text-sm text-muted-foreground">{{ customer.email }}</p>
          </div>

          <!-- Line items table -->
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent border-b border-border">
                <TableHead class="text-xs pl-0">Description</TableHead>
                <TableHead class="text-xs text-right">Qty</TableHead>
                <TableHead class="text-xs text-right">Unit price</TableHead>
                <TableHead class="text-xs text-right pr-0">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="line in lineItems"
                :key="line.id"
                class="hover:bg-transparent"
              >
                <TableCell class="pl-0 py-3">
                  <p class="text-sm font-medium text-foreground">
                    {{ line.description || 'Line item' }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ formatDateShort(line.period.start) }} – {{ formatDateShort(line.period.end) }}
                  </p>
                </TableCell>
                <TableCell class="text-sm text-right text-muted-foreground py-3">
                  {{ line.quantity }}
                </TableCell>
                <TableCell class="text-sm text-right text-muted-foreground py-3">
                  {{ formatUnitAmount(line.price?.unit_amount ?? null, line.currency) }}
                </TableCell>
                <TableCell class="text-sm font-medium text-foreground text-right pr-0 py-3">
                  {{ formatAmount(line.amount, line.currency) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <!-- Totals -->
          <div class="mt-4 border-t border-border pt-4 space-y-2 pb-6">
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Subtotal</span>
              <span class="text-sm text-foreground">{{ formatAmount(subtotal, invoice.currency) }}</span>
            </div>
            <Separator v-if="invoice.amount_due !== subtotal" />
            <div class="flex justify-between items-center font-semibold">
              <span class="text-sm text-foreground">Amount due</span>
              <span class="text-base text-foreground">{{ formatAmount(invoice.amount_due, invoice.currency) }}</span>
            </div>
            <div v-if="invoice.amount_paid > 0" class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Amount paid</span>
              <span class="text-sm text-green-700">{{ formatAmount(invoice.amount_paid, invoice.currency) }}</span>
            </div>
            <div v-if="invoice.amount_remaining > 0" class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Amount remaining</span>
              <span class="text-sm text-foreground">{{ formatAmount(invoice.amount_remaining, invoice.currency) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Payment details section -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard class="h-4 w-4 text-muted-foreground" />
            Payment details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p class="text-xs text-muted-foreground mb-1">Status</p>
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  getStatusBadgeClass(invoice.status)
                ]"
              >
                {{ getStatusLabel(invoice.status) }}
              </span>
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1">Period</p>
              <p class="text-sm text-foreground">
                {{ formatDateShort(invoice.period_start) }} – {{ formatDateShort(invoice.period_end) }}
              </p>
            </div>
            <div v-if="invoice.receipt_number">
              <p class="text-xs text-muted-foreground mb-1">Receipt number</p>
              <p class="text-sm font-mono text-foreground">{{ invoice.receipt_number }}</p>
            </div>
            <div v-if="invoice.subscription">
              <p class="text-xs text-muted-foreground mb-1">Subscription</p>
              <RouterLink
                :to="`/subscriptions/${invoice.subscription}`"
                class="text-sm text-blue-600 hover:underline font-mono"
              >
                {{ invoice.subscription.slice(0, 20) }}…
              </RouterLink>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
