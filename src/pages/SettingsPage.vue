<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Building2,
  Palette,
  Users,
  Mail,
  CreditCard,
  Save,
  Check,
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Nav sections ─────────────────────────────────────────────────────────────

const sections = [
  { id: 'account', label: 'Account details', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'team', label: 'Team members', icon: Users },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

const activeSection = ref('account')

// ─── Form state ───────────────────────────────────────────────────────────────

const form = ref({
  businessName: 'My Stripe Account',
  statementDescriptor: 'MY STRIPE ACC',
  country: 'US',
  currency: 'usd',
})

const saving = ref(false)
const saved = ref(false)

const descriptorLength = computed(() => form.value.statementDescriptor.length)
const descriptorMax = 22

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'SG', label: 'Singapore' },
]

const currencies = [
  { value: 'usd', label: 'USD – US Dollar' },
  { value: 'eur', label: 'EUR – Euro' },
  { value: 'gbp', label: 'GBP – British Pound' },
  { value: 'cad', label: 'CAD – Canadian Dollar' },
  { value: 'aud', label: 'AUD – Australian Dollar' },
  { value: 'jpy', label: 'JPY – Japanese Yen' },
  { value: 'sgd', label: 'SGD – Singapore Dollar' },
]

// ─── Actions ──────────────────────────────────────────────────────────────────

async function saveChanges() {
  saving.value = true
  saved.value = false
  try {
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-foreground">Settings</h1>
      <p class="text-sm text-muted-foreground mt-0.5">Manage your account settings and preferences.</p>
    </div>

    <div class="flex gap-6">
      <!-- Left sidebar nav -->
      <nav class="w-48 shrink-0">
        <ul class="space-y-0.5">
          <li v-for="section in sections" :key="section.id">
            <button
              class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left"
              :class="
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              "
              @click="activeSection = section.id"
            >
              <component :is="section.icon" class="h-4 w-4 shrink-0" />
              {{ section.label }}
            </button>
          </li>
        </ul>
      </nav>

      <!-- Main content -->
      <div class="flex-1 min-w-0 space-y-6">

        <!-- ── Account details ──────────────────────────────────────────────── -->
        <template v-if="activeSection === 'account'">
          <Card>
            <CardHeader class="pb-4">
              <CardTitle class="text-base font-semibold">Account details</CardTitle>
              <CardDescription>
                Update your business information. This will appear on invoices and receipts.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-5">
              <!-- Business name -->
              <div class="space-y-1.5">
                <Label for="business-name" class="text-sm font-medium">Business name</Label>
                <Input
                  id="business-name"
                  v-model="form.businessName"
                  placeholder="Enter your business name"
                  class="max-w-md"
                />
                <p class="text-xs text-muted-foreground">
                  This is how your business will appear to customers.
                </p>
              </div>

              <!-- Account ID -->
              <div class="space-y-1.5">
                <Label class="text-sm font-medium">Account ID</Label>
                <div class="flex items-center gap-2 max-w-md">
                  <Input
                    value="acct_1NxxxxxxxxxxxxxxX"
                    readonly
                    class="font-mono text-sm bg-muted/50 text-muted-foreground"
                  />
                </div>
                <p class="text-xs text-muted-foreground">
                  Your unique Stripe account identifier.
                </p>
              </div>

              <Separator />

              <!-- Statement descriptor -->
              <div class="space-y-1.5">
                <Label for="statement-descriptor" class="text-sm font-medium">
                  Statement descriptor
                </Label>
                <div class="relative max-w-md">
                  <Input
                    id="statement-descriptor"
                    v-model="form.statementDescriptor"
                    :maxlength="descriptorMax"
                    placeholder="MY BUSINESS"
                    class="pr-12 uppercase"
                  />
                  <span
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
                    :class="descriptorLength >= descriptorMax ? 'text-red-500' : ''"
                  >
                    {{ descriptorLength }}/{{ descriptorMax }}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground">
                  Appears on customer bank statements. Between 5 and {{ descriptorMax }} characters.
                </p>
              </div>

              <Separator />

              <!-- Country -->
              <div class="space-y-1.5">
                <Label class="text-sm font-medium">Country</Label>
                <Select v-model="form.country">
                  <SelectTrigger class="max-w-md">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="country in countries"
                        :key="country.value"
                        :value="country.value"
                      >
                        {{ country.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground">
                  Your business country determines available payment methods.
                </p>
              </div>

              <!-- Default currency -->
              <div class="space-y-1.5">
                <Label class="text-sm font-medium">Default currency</Label>
                <Select v-model="form.currency">
                  <SelectTrigger class="max-w-md">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="currency in currencies"
                        :key="currency.value"
                        :value="currency.value"
                      >
                        {{ currency.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground">
                  The default currency used for new charges.
                </p>
              </div>

              <!-- Save button -->
              <div class="flex items-center gap-3 pt-2">
                <Button
                  :disabled="saving"
                  class="gap-2 min-w-28"
                  @click="saveChanges"
                >
                  <Check v-if="saved" class="h-4 w-4" />
                  <Save v-else class="h-4 w-4" />
                  {{ saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes' }}
                </Button>
                <span v-if="saved" class="text-sm text-green-600">Changes saved successfully.</span>
              </div>
            </CardContent>
          </Card>
        </template>

        <!-- ── Branding ────────────────────────────────────────────────────── -->
        <template v-else-if="activeSection === 'branding'">
          <Card>
            <CardHeader class="pb-4">
              <CardTitle class="text-base font-semibold">Branding</CardTitle>
              <CardDescription>
                Customize how your business looks to customers on hosted pages and emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <Palette class="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p class="text-sm text-muted-foreground">Branding settings coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </template>

        <!-- ── Team members ────────────────────────────────────────────────── -->
        <template v-else-if="activeSection === 'team'">
          <Card>
            <CardHeader class="pb-4">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-base font-semibold">Team members</CardTitle>
                  <CardDescription class="mt-1">
                    Invite team members to collaborate on your Stripe account.
                  </CardDescription>
                </div>
                <Button size="sm" class="gap-1.5 shrink-0">
                  <Users class="h-3.5 w-3.5" />
                  Invite member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <Users class="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p class="text-sm font-medium text-foreground mb-1">Only you have access</p>
                <p class="text-sm text-muted-foreground">Invite team members to manage your account.</p>
              </div>
            </CardContent>
          </Card>
        </template>

        <!-- ── Emails ──────────────────────────────────────────────────────── -->
        <template v-else-if="activeSection === 'emails'">
          <Card>
            <CardHeader class="pb-4">
              <CardTitle class="text-base font-semibold">Emails</CardTitle>
              <CardDescription>
                Configure automated emails sent to your customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <Mail class="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p class="text-sm text-muted-foreground">Email settings coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </template>

        <!-- ── Billing ─────────────────────────────────────────────────────── -->
        <template v-else-if="activeSection === 'billing'">
          <Card>
            <CardHeader class="pb-4">
              <CardTitle class="text-base font-semibold">Billing</CardTitle>
              <CardDescription>
                Manage your Stripe subscription and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard class="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p class="text-sm text-muted-foreground">Billing settings coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </template>

      </div>
    </div>
  </div>
</template>
