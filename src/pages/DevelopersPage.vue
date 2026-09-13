<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Webhook,
  Activity,
  FileText,
  AlertCircle,
  ChevronRight,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { eventsApi } from '@/lib/api'
import type { Event } from '@/lib/api'

// ─── State ────────────────────────────────────────────────────────────────────

const activeTab = ref('api-keys')
const secretRevealed = ref(false)
const copiedKey = ref<string | null>(null)
const eventsLoading = ref(false)
const events = ref<Event[]>([])

// ─── Static key data (masked) ─────────────────────────────────────────────────

const publishableKey = 'pk_test_51NxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxAbCdEf'
const secretKeyMasked = 'sk_test_••••••••••••••••••••••••••••••••'
const secretKeyFull = 'sk_test_51NxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxXyZaBc'

// ─── Mock API log data ────────────────────────────────────────────────────────

interface LogEntry {
  id: string
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  status: number
  duration: number
  time: string
}

const apiLogs: LogEntry[] = [
  { id: 'req_1', method: 'GET', path: '/v1/payment_intents', status: 200, duration: 48, time: '2 min ago' },
  { id: 'req_2', method: 'POST', path: '/v1/customers', status: 200, duration: 112, time: '5 min ago' },
  { id: 'req_3', method: 'GET', path: '/v1/balance', status: 200, duration: 33, time: '8 min ago' },
  { id: 'req_4', method: 'POST', path: '/v1/payment_intents', status: 200, duration: 95, time: '12 min ago' },
  { id: 'req_5', method: 'GET', path: '/v1/customers?limit=10', status: 200, duration: 61, time: '18 min ago' },
  { id: 'req_6', method: 'POST', path: '/v1/subscriptions', status: 400, duration: 44, time: '25 min ago' },
  { id: 'req_7', method: 'GET', path: '/v1/invoices', status: 200, duration: 72, time: '31 min ago' },
  { id: 'req_8', method: 'DELETE', path: '/v1/customers/cus_xxx', status: 200, duration: 58, time: '45 min ago' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts * 1000))
}

async function copyToClipboard(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => { copiedKey.value = null }, 2000)
  } catch (err) {
    console.error('Clipboard copy failed', err)
  }
}

function maskKey(key: string): string {
  if (key.length <= 12) return key
  return key.slice(0, 8) + '••••••••••••••••••••' + key.slice(-4)
}

function getMethodClass(method: string): string {
  switch (method) {
    case 'GET': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'POST': return 'text-green-700 bg-green-50 border-green-200'
    case 'DELETE': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function getStatusClass(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-700'
  if (status >= 400) return 'text-red-600'
  return 'text-muted-foreground'
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

async function loadEvents() {
  if (events.value.length > 0) return
  eventsLoading.value = true
  try {
    const res = await eventsApi.list({ limit: 20 })
    events.value = res.data
  } catch (err) {
    console.error('Failed to load events', err)
  } finally {
    eventsLoading.value = false
  }
}

onMounted(async () => {
  // Pre-load events when the component mounts
  await loadEvents()
})
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Developers</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          API keys, webhooks, events, and request logs.
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab">
      <TabsList class="h-9">
        <TabsTrigger value="api-keys" class="text-sm gap-1.5">
          <Key class="h-3.5 w-3.5" />
          API keys
        </TabsTrigger>
        <TabsTrigger value="webhooks" class="text-sm gap-1.5">
          <Webhook class="h-3.5 w-3.5" />
          Webhooks
        </TabsTrigger>
        <TabsTrigger value="events" class="text-sm gap-1.5">
          <Activity class="h-3.5 w-3.5" />
          Events
        </TabsTrigger>
        <TabsTrigger value="logs" class="text-sm gap-1.5">
          <FileText class="h-3.5 w-3.5" />
          Logs
        </TabsTrigger>
      </TabsList>

      <!-- ── API Keys tab ───────────────────────────────────────────────────── -->
      <TabsContent value="api-keys" class="mt-4 space-y-4">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base font-semibold">Standard keys</CardTitle>
            <CardDescription>
              These keys allow your integration to authenticate with Stripe's API. Keep your secret
              key safe — never expose it in client-side code.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Publishable key -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-foreground">Publishable key</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 min-w-0">
                  <Key class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span class="text-sm font-mono text-foreground truncate">
                    {{ maskKey(publishableKey) }}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  class="shrink-0 gap-1.5"
                  @click="copyToClipboard(publishableKey, 'pk')"
                >
                  <Check v-if="copiedKey === 'pk'" class="h-3.5 w-3.5 text-green-600" />
                  <Copy v-else class="h-3.5 w-3.5" />
                  {{ copiedKey === 'pk' ? 'Copied' : 'Copy' }}
                </Button>
              </div>
            </div>

            <Separator />

            <!-- Secret key -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-foreground">Secret key</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 min-w-0">
                  <Key class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span class="text-sm font-mono text-foreground truncate">
                    {{ secretRevealed ? maskKey(secretKeyFull) : secretKeyMasked }}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  class="shrink-0 gap-1.5"
                  @click="secretRevealed = !secretRevealed"
                >
                  <EyeOff v-if="secretRevealed" class="h-3.5 w-3.5" />
                  <Eye v-else class="h-3.5 w-3.5" />
                  {{ secretRevealed ? 'Hide' : 'Reveal live key' }}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="shrink-0 gap-1.5"
                  :disabled="!secretRevealed"
                  @click="secretRevealed && copyToClipboard(secretKeyFull, 'sk')"
                >
                  <Check v-if="copiedKey === 'sk'" class="h-3.5 w-3.5 text-green-600" />
                  <Copy v-else class="h-3.5 w-3.5" />
                  {{ copiedKey === 'sk' ? 'Copied' : 'Copy' }}
                </Button>
              </div>
              <p class="text-xs text-amber-700 flex items-center gap-1">
                <AlertCircle class="h-3 w-3" />
                Never share your secret key or commit it to version control.
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Restricted keys -->
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-base font-semibold">Restricted keys</CardTitle>
                <CardDescription class="mt-1">
                  Create keys with granular permissions for specific integrations.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" class="gap-1.5 shrink-0">
                <Plus class="h-3.5 w-3.5" />
                Create restricted key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Key class="h-8 w-8 mb-2 opacity-40" />
              <p class="text-sm">No restricted keys yet</p>
              <p class="text-xs mt-1">Restricted keys limit API access to specific resources.</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- ── Webhooks tab ───────────────────────────────────────────────────── -->
      <TabsContent value="webhooks" class="mt-4">
        <Card>
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-base font-semibold">Webhook endpoints</CardTitle>
                <CardDescription class="mt-1">
                  Stripe sends events to your endpoints when something happens in your account.
                </CardDescription>
              </div>
              <Button size="sm" class="gap-1.5 shrink-0">
                <Plus class="h-3.5 w-3.5" />
                Add endpoint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Webhook class="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 class="text-sm font-semibold text-foreground mb-1">No webhooks configured</h3>
              <p class="text-sm text-muted-foreground mb-4 max-w-sm">
                Add an endpoint to receive real-time notifications when events occur in your Stripe
                account.
              </p>
              <Button variant="outline" size="sm" class="gap-1.5">
                <Plus class="h-3.5 w-3.5" />
                Add endpoint
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- ── Events tab ─────────────────────────────────────────────────────── -->
      <TabsContent value="events" class="mt-4">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base font-semibold">Recent events</CardTitle>
            <CardDescription>Events generated by your account in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent class="p-0">
            <template v-if="eventsLoading">
              <div class="p-4 space-y-3">
                <Skeleton v-for="i in 6" :key="i" class="h-12 w-full" />
              </div>
            </template>
            <template v-else-if="events.length === 0">
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <Activity class="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p class="text-sm text-muted-foreground">No events yet</p>
              </div>
            </template>
            <template v-else>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event type</TableHead>
                    <TableHead>Object ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead class="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="event in events" :key="event.id">
                    <TableCell>
                      <span class="text-sm font-mono text-foreground">{{ event.type }}</span>
                    </TableCell>
                    <TableCell>
                      <span class="text-xs font-mono text-muted-foreground">{{ event.id }}</span>
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground whitespace-nowrap">
                      {{ formatDate(event.created) }}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm">
                        <ChevronRight class="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </template>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- ── Logs tab ───────────────────────────────────────────────────────── -->
      <TabsContent value="logs" class="mt-4">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base font-semibold">API request logs</CardTitle>
            <CardDescription>Recent API calls made to the Stripe API.</CardDescription>
          </CardHeader>
          <CardContent class="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-20">Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead class="w-20">Status</TableHead>
                  <TableHead class="w-24">Duration</TableHead>
                  <TableHead class="w-28">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="log in apiLogs" :key="log.id">
                  <TableCell>
                    <span
                      class="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold font-mono"
                      :class="getMethodClass(log.method)"
                    >
                      {{ log.method }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-sm font-mono text-foreground">{{ log.path }}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      class="text-sm font-mono font-medium"
                      :class="getStatusClass(log.status)"
                    >
                      {{ log.status }}
                    </span>
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ log.duration }}ms
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ log.time }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
