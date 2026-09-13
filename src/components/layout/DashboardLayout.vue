<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import {
  Home,
  CreditCard,
  Scale,
  Users,
  RefreshCw,
  FileText,
  Link2,
  Package,
  BarChart3,
  Code2,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  MessageSquare,
  FlaskConical,
  Menu,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const uiStore = useUiStore()

const customersExpanded = ref(false)

interface NavItem {
  label: string
  path: string
  icon: unknown
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: Home },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Balances', path: '/balance', icon: Scale },
  {
    label: 'Customers', path: '/customers', icon: Users,
    children: [
      { label: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
      { label: 'Invoices', path: '/invoices', icon: FileText },
    ],
  },
  { label: 'Connected accounts', path: '/connected', icon: Link2 },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
]

const bottomNavItems: NavItem[] = [
  { label: 'Developers', path: '/developers', icon: Code2 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}

function isCustomersActive(): boolean {
  return isActive('/customers') || isActive('/subscriptions') || isActive('/invoices')
}

function toggleCustomers() {
  customersExpanded.value = !customersExpanded.value
}

// Auto-expand customers section when on a child route
const shouldExpandCustomers = computed(() => {
  return customersExpanded.value || isActive('/subscriptions') || isActive('/invoices')
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Sidebar -->
    <aside
      class="flex flex-col border-r border-border bg-white transition-all duration-200"
      :class="uiStore.sidebarCollapsed ? 'w-14' : 'w-[220px]'"
    >
      <!-- Account Selector -->
      <div class="flex h-12 items-center px-3 border-b border-border shrink-0">
        <button
          v-if="!uiStore.sidebarCollapsed"
          class="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span class="flex h-6 w-6 items-center justify-center rounded bg-violet-600 text-white text-xs font-bold shrink-0">
            S
          </span>
          <span class="flex-1 text-left truncate text-foreground">My Stripe Account</span>
          <ChevronDown class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
        <button
          v-else
          class="flex items-center justify-center w-full"
          @click="uiStore.toggleSidebar()"
        >
          <span class="flex h-6 w-6 items-center justify-center rounded bg-violet-600 text-white text-xs font-bold">
            S
          </span>
        </button>
      </div>

      <!-- Navigation -->
      <ScrollArea class="flex-1">
        <nav class="py-2 px-2">
          <template v-for="item in navItems" :key="item.path">
            <!-- Item with children (Customers) -->
            <template v-if="item.children">
              <button
                class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
                :class="[
                  isCustomersActive()
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  uiStore.sidebarCollapsed ? 'justify-center' : ''
                ]"
                @click="toggleCustomers"
              >
                <component :is="item.icon" class="h-4 w-4 shrink-0" />
                <template v-if="!uiStore.sidebarCollapsed">
                  <span class="flex-1 text-left">{{ item.label }}</span>
                  <ChevronRight
                    class="h-3.5 w-3.5 shrink-0 transition-transform"
                    :class="shouldExpandCustomers ? 'rotate-90' : ''"
                  />
                </template>
              </button>

              <!-- Child items -->
              <div
                v-if="shouldExpandCustomers && !uiStore.sidebarCollapsed"
                class="mt-0.5 mb-0.5 ml-4 pl-2 border-l border-border"
              >
                <RouterLink
                  :to="item.path"
                  class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
                  :class="[
                    isActive(item.path) && !isActive('/subscriptions') && !isActive('/invoices')
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  ]"
                >
                  <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
                  <span>{{ item.label }}</span>
                </RouterLink>
                <RouterLink
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
                  :class="[
                    isActive(child.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  ]"
                >
                  <component :is="child.icon" class="h-3.5 w-3.5 shrink-0" />
                  <span>{{ child.label }}</span>
                </RouterLink>
              </div>
            </template>

            <!-- Regular nav item -->
            <RouterLink
              v-else
              :to="item.path"
              class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
              :class="[
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                uiStore.sidebarCollapsed ? 'justify-center' : ''
              ]"
            >
              <component :is="item.icon" class="h-4 w-4 shrink-0" />
              <span v-if="!uiStore.sidebarCollapsed">{{ item.label }}</span>
            </RouterLink>
          </template>
        </nav>
      </ScrollArea>

      <!-- Bottom Section -->
      <div class="px-2 pb-3 pt-1 space-y-0.5 border-t border-border">
        <RouterLink
          v-for="item in bottomNavItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
          :class="[
            isActive(item.path)
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            uiStore.sidebarCollapsed ? 'justify-center' : ''
          ]"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          <span v-if="!uiStore.sidebarCollapsed">{{ item.label }}</span>
        </RouterLink>

        <!-- Test mode toggle -->
        <Separator class="my-2" />
        <button
          v-if="!uiStore.sidebarCollapsed"
          class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          @click="uiStore.toggleTestMode()"
        >
          <FlaskConical class="h-4 w-4 shrink-0" />
          <span class="flex-1 text-left">Test mode</span>
          <div
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
            :class="uiStore.testMode ? 'bg-blue-600' : 'bg-muted-foreground/30'"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
              :class="uiStore.testMode ? 'translate-x-4' : 'translate-x-0'"
            />
          </div>
        </button>
        <button
          v-else
          class="flex w-full items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors"
          :class="uiStore.testMode ? 'text-blue-600' : 'text-muted-foreground'"
          @click="uiStore.toggleTestMode()"
        >
          <FlaskConical class="h-4 w-4" />
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header class="flex h-12 items-center gap-3 border-b border-border bg-white px-4 shrink-0">
        <!-- Collapse toggle -->
        <Button
          variant="ghost"
          size="icon-sm"
          class="shrink-0 text-muted-foreground"
          @click="uiStore.toggleSidebar()"
        >
          <Menu class="h-4 w-4" />
        </Button>

        <!-- Search -->
        <div class="relative flex-1 max-w-xl">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search..."
            class="pl-8 h-8 text-sm bg-muted/50 border-transparent focus:border-border focus:bg-background"
          />
        </div>

        <div class="ml-auto flex items-center gap-1">
          <!-- Test mode badge -->
          <Badge
            v-if="uiStore.testMode"
            variant="outline"
            class="text-xs font-medium text-amber-700 border-amber-300 bg-amber-50 mr-1"
          >
            Test mode
          </Badge>

          <!-- Feedback -->
          <Button variant="ghost" size="icon-sm" class="text-muted-foreground">
            <MessageSquare class="h-4 w-4" />
          </Button>

          <!-- Notifications -->
          <Button variant="ghost" size="icon-sm" class="relative text-muted-foreground">
            <Bell class="h-4 w-4" />
            <span class="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
          </Button>

          <!-- Help -->
          <Button variant="ghost" size="icon-sm" class="text-muted-foreground">
            <HelpCircle class="h-4 w-4" />
          </Button>

          <!-- User avatar -->
          <button class="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white text-xs font-semibold shrink-0">
            U
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto bg-gray-50">
        <RouterView />
      </main>
    </div>
  </div>
</template>
