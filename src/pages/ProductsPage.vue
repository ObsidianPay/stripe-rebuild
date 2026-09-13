<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Package,
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  Tag,
  ChevronRight,
} from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { productsApi, pricesApi } from '@/lib/api'
import type { Product, Price } from '@/lib/api'

// ─── State ────────────────────────────────────────────────────────────────────

const loading = ref(true)
const products = ref<Product[]>([])
const pricesByProduct = ref<Record<string, Price[]>>({})
const activeTab = ref('products')

// ─── Computed ─────────────────────────────────────────────────────────────────

const activeProducts = computed(() => products.value.filter((p) => p.active))
const archivedProducts = computed(() => products.value.filter((p) => !p.active))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}

function formatPrice(price: Price): string {
  const amount =
    price.unit_amount !== null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: price.currency.toUpperCase(),
        }).format(price.unit_amount / 100)
      : 'Custom'

  if (price.type === 'recurring' && price.recurring) {
    const { interval, interval_count } = price.recurring
    const intervalLabel = interval_count === 1 ? interval : `${interval_count} ${interval}s`
    return `${amount}/${intervalLabel}`
  }
  return `${amount} one-time`
}

async function archiveProduct(id: string) {
  try {
    await productsApi.archive(id)
    const idx = products.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], active: false }
    }
  } catch (err) {
    console.error('Failed to archive product', err)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const res = await productsApi.list({ limit: 100 })
    products.value = res.data

    // Fetch prices for all products in parallel
    const priceResults = await Promise.all(
      res.data.map((p) => pricesApi.list({ product: p.id, limit: 10 })),
    )
    res.data.forEach((p, i) => {
      pricesByProduct.value[p.id] = priceResults[i].data
    })
  } catch (err) {
    console.error('Failed to load products', err)
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
        <h1 class="text-2xl font-semibold text-foreground">Products</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Manage your product catalog and pricing.</p>
      </div>
      <Button>
        <Plus class="h-4 w-4" />
        Add product
      </Button>
    </div>

    <!-- Tabs -->
    <Tabs v-model="activeTab">
      <TabsList class="h-9">
        <TabsTrigger value="products" class="text-sm">Products</TabsTrigger>
        <TabsTrigger value="pricing-tables" class="text-sm">Pricing tables</TabsTrigger>
      </TabsList>

      <!-- Products tab -->
      <TabsContent value="products" class="mt-4 space-y-3">
        <!-- Loading state -->
        <template v-if="loading">
          <Card v-for="i in 4" :key="i">
            <CardContent class="p-4">
              <div class="flex items-start justify-between gap-4">
                <Skeleton class="h-10 w-10 rounded-lg shrink-0" />
                <div class="space-y-2 flex-1">
                  <Skeleton class="h-5 w-48" />
                  <Skeleton class="h-4 w-72" />
                  <Skeleton class="h-4 w-32" />
                </div>
                <Skeleton class="h-8 w-8 rounded shrink-0" />
              </div>
            </CardContent>
          </Card>
        </template>

        <!-- Empty state -->
        <template v-else-if="products.length === 0">
          <Card>
            <CardContent class="flex flex-col items-center justify-center py-16 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Package class="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 class="text-base font-semibold text-foreground mb-1">No products yet</h3>
              <p class="text-sm text-muted-foreground mb-4 max-w-xs">
                Create your first product to start accepting payments and managing subscriptions.
              </p>
              <Button>
                <Plus class="h-4 w-4" />
                Add your first product
              </Button>
            </CardContent>
          </Card>
        </template>

        <!-- Products list -->
        <template v-else>
          <!-- Active products -->
          <Card v-for="product in activeProducts" :key="product.id">
            <CardContent class="p-4">
              <div class="flex items-start gap-4">
                <!-- Product icon -->
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted"
                >
                  <Package class="h-5 w-5 text-muted-foreground" />
                </div>

                <!-- Product details -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-foreground text-sm">{{ product.name }}</span>
                    <Badge
                      variant="outline"
                      class="text-xs border-green-200 bg-green-50 text-green-700"
                    >
                      Active
                    </Badge>
                  </div>

                  <p
                    v-if="product.description"
                    class="text-sm text-muted-foreground mt-0.5 line-clamp-1"
                  >
                    {{ product.description }}
                  </p>

                  <!-- Prices -->
                  <div class="flex flex-wrap gap-2 mt-2">
                    <template v-if="pricesByProduct[product.id]?.length">
                      <span
                        v-for="price in pricesByProduct[product.id]"
                        :key="price.id"
                        class="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-medium"
                      >
                        <Tag class="h-3 w-3" />
                        {{ formatPrice(price) }}
                      </span>
                    </template>
                    <span v-else class="text-xs text-muted-foreground italic">No prices set</span>
                  </div>
                </div>

                <!-- Meta + Actions -->
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-xs text-muted-foreground hidden sm:block">
                    {{ formatDate(product.created) }}
                  </span>
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" title="Edit product">
                      <Pencil class="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" class="w-44">
                        <DropdownMenuItem>
                          <Pencil class="h-4 w-4" />
                          Edit product
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Tag class="h-4 w-4" />
                          Add price
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          class="text-destructive focus:text-destructive"
                          @click="archiveProduct(product.id)"
                        >
                          <Archive class="h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Archived section -->
          <template v-if="archivedProducts.length > 0">
            <Separator class="my-4" />
            <h3 class="text-sm font-medium text-muted-foreground px-1">
              Archived ({{ archivedProducts.length }})
            </h3>
            <Card v-for="product in archivedProducts" :key="product.id" class="opacity-60">
              <CardContent class="p-4">
                <div class="flex items-start gap-4">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted"
                  >
                    <Package class="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-foreground text-sm">{{ product.name }}</span>
                      <Badge variant="outline" class="text-xs text-muted-foreground">Archived</Badge>
                    </div>
                    <p
                      v-if="product.description"
                      class="text-sm text-muted-foreground mt-0.5 line-clamp-1"
                    >
                      {{ product.description }}
                    </p>
                  </div>
                  <span class="text-xs text-muted-foreground hidden sm:block shrink-0">
                    {{ formatDate(product.created) }}
                  </span>
                </div>
              </CardContent>
            </Card>
          </template>
        </template>
      </TabsContent>

      <!-- Pricing tables tab -->
      <TabsContent value="pricing-tables" class="mt-4">
        <Card>
          <CardContent class="flex flex-col items-center justify-center py-16 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <ChevronRight class="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 class="text-base font-semibold text-foreground mb-1">No pricing tables</h3>
            <p class="text-sm text-muted-foreground mb-4 max-w-xs">
              Pricing tables let you embed a pricing comparison on your website.
            </p>
            <Button variant="outline">Create pricing table</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
