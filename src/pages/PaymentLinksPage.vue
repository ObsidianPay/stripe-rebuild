<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Link2,
  Plus,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { paymentLinksApi } from '@/lib/api'
import type { PaymentLink } from '@/lib/api'

// ─── State ────────────────────────────────────────────────────────────────────

const loading = ref(true)
const links = ref<PaymentLink[]>([])
const copiedId = ref<string | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname + u.pathname
  } catch {
    return url.length > 40 ? url.slice(0, 40) + '…' : url
  }
}

async function copyLink(link: PaymentLink) {
  try {
    await navigator.clipboard.writeText(link.url)
    copiedId.value = link.id
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch (err) {
    console.error('Clipboard copy failed', err)
  }
}

async function toggleActive(link: PaymentLink) {
  const originalActive = link.active
  // Optimistic update
  const idx = links.value.findIndex((l) => l.id === link.id)
  if (idx !== -1) {
    links.value[idx] = { ...links.value[idx], active: !link.active }
  }
  try {
    await paymentLinksApi.update(link.id, { active: !originalActive })
  } catch (err) {
    // Revert on failure
    if (idx !== -1) {
      links.value[idx] = { ...links.value[idx], active: originalActive }
    }
    console.error('Failed to toggle payment link', err)
  }
}

function getProductName(link: PaymentLink): string {
  const firstItem = link.line_items?.data?.[0]
  if (!firstItem) return link.id
  return firstItem.price?.product ?? link.id
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const res = await paymentLinksApi.list({ limit: 100 })
    links.value = res.data
  } catch (err) {
    console.error('Failed to load payment links', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Payment links</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Share payment links without a website or code.
        </p>
      </div>
      <Button>
        <Plus class="h-4 w-4" />
        New
      </Button>
    </div>

    <!-- Table -->
    <Card>
      <CardContent class="p-0">
        <!-- Loading -->
        <template v-if="loading">
          <div class="p-4 space-y-3">
            <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
          </div>
        </template>

        <!-- Empty state -->
        <template v-else-if="links.length === 0">
          <div class="flex flex-col items-center justify-center py-16 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Link2 class="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 class="text-base font-semibold text-foreground mb-1">No payment links yet</h3>
            <p class="text-sm text-muted-foreground mb-4 max-w-xs">
              Create a payment link and share it anywhere — no website required.
            </p>
            <Button>
              <Plus class="h-4 w-4" />
              Create payment link
            </Button>
          </div>
        </template>

        <!-- Links table -->
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Product</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead class="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="link in links" :key="link.id">
                <!-- Name / ID -->
                <TableCell>
                  <div>
                    <p class="font-medium text-foreground text-sm font-mono">{{ link.id }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5">{{ getProductName(link) }}</p>
                  </div>
                </TableCell>

                <!-- Link URL -->
                <TableCell>
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-blue-600 font-mono truncate max-w-[200px]">
                      {{ truncateUrl(link.url) }}
                    </span>
                    <button
                      class="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      :title="copiedId === link.id ? 'Copied!' : 'Copy link'"
                      @click="copyLink(link)"
                    >
                      <Check v-if="copiedId === link.id" class="h-3.5 w-3.5 text-green-600" />
                      <Copy v-else class="h-3.5 w-3.5" />
                    </button>
                    <a
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Open link"
                    >
                      <ExternalLink class="h-3.5 w-3.5" />
                    </a>
                  </div>
                </TableCell>

                <!-- Status toggle -->
                <TableCell>
                  <button
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer"
                    :class="
                      link.active
                        ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    "
                    @click="toggleActive(link)"
                  >
                    {{ link.active ? 'Active' : 'Inactive' }}
                  </button>
                </TableCell>

                <!-- Created -->
                <TableCell class="text-sm text-muted-foreground whitespace-nowrap">
                  {{ formatDate(link.created) }}
                </TableCell>

                <!-- Actions -->
                <TableCell>
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Share link"
                      @click="copyLink(link)"
                    >
                      <Share2 class="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" class="w-44">
                        <DropdownMenuItem @click="copyLink(link)">
                          <Copy class="h-4 w-4" />
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink class="h-4 w-4" />
                          Open link
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="toggleActive(link)">
                          <Share2 class="h-4 w-4" />
                          {{ link.active ? 'Deactivate' : 'Activate' }}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
