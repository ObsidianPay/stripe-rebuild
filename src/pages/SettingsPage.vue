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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

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

// ─── Account Actions ──────────────────────────────────────────────────────────

async function saveChanges() {
  saving.value = true
  saved.value = false
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } finally {
    saving.value = false
  }
}

// ─── Branding ─────────────────────────────────────────────────────────────────

const logoPreview = ref<string | null>(null)
const brandColor = ref('#4F46E5')
const iconPreview = ref<string | null>(null)
const brandingSaved = ref(false)

function handleLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function handleIconUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    iconPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function saveBranding() {
  brandingSaved.value = true
  setTimeout(() => { brandingSaved.value = false }, 3000)
}

// ─── Emails ───────────────────────────────────────────────────────────────────

const emailSettings = ref({
  paymentReceipts: true,
  failedPayments: true,
  renewalReminders: false,
  expiringCards: true,
})

const emailsSaved = ref(false)

function saveEmailSettings() {
  emailsSaved.value = true
  setTimeout(() => { emailsSaved.value = false }, 3000)
}

const emailToggles = [
  { key: 'paymentReceipts' as const, label: 'Successful payment receipts', desc: 'Send receipt emails to customers after successful payments.' },
  { key: 'failedPayments' as const, label: 'Failed payment emails', desc: 'Notify customers when a payment fails.' },
  { key: 'renewalReminders' as const, label: 'Subscription renewal reminders', desc: 'Remind customers 7 days before renewal.' },
  { key: 'expiringCards' as const, label: 'Expiring card notifications', desc: 'Notify customers when their card is about to expire.' },
]

// ─── Team members ─────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

const teamMembers = ref<TeamMember[]>([])
const teamInviteOpen = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('read-only')

const roleLabels: Record<string, string> = {
  administrator: 'Administrator',
  developer: 'Developer',
  analyst: 'Analyst',
  'read-only': 'Read-only',
}

function sendInvite() {
  if (!inviteEmail.value) return
  teamMembers.value.push({
    id: Date.now().toString(),
    name: inviteEmail.value.split('@')[0],
    email: inviteEmail.value,
    role: inviteRole.value,
  })
  inviteEmail.value = ''
  inviteRole.value = 'read-only'
  teamInviteOpen.value = false
}

function revokeMember(id: string) {
  teamMembers.value = teamMembers.value.filter((m) => m.id !== id)
}

// ─── Billing ──────────────────────────────────────────────────────────────────

const starterFeatures = [
  'Up to 100 transactions/month',
  '2 team members',
  'Standard support',
  'Basic reporting',
]

const billingHistory = [
  { date: 'Oct 1, 2025', description: 'Starter plan', amount: '$0.00', status: 'Paid' },
  { date: 'Sep 1, 2025', description: 'Starter plan', amount: '$0.00', status: 'Paid' },
  { date: 'Aug 1, 2025', description: 'Starter plan', amount: '$0.00', status: 'Paid' },
]

function upgradeClicked() {
  alert('Contact sales to upgrade.')
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
            <CardContent class="space-y-6">
              <!-- Logo upload -->
              <div class="space-y-2">
                <Label class="text-sm font-medium">Business logo</Label>
                <label
                  class="flex flex-col items-center justify-center w-full max-w-xs h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors overflow-hidden"
                >
                  <img
                    v-if="logoPreview"
                    :src="logoPreview"
                    alt="Logo preview"
                    class="h-full w-full object-contain p-2"
                  />
                  <div v-else class="flex flex-col items-center gap-1 text-muted-foreground">
                    <Palette class="h-6 w-6 opacity-50" />
                    <span class="text-xs">Upload logo</span>
                    <span class="text-xs opacity-60">PNG, JPG, SVG up to 2MB</span>
                  </div>
                  <input type="file" accept="image/*" class="hidden" @change="handleLogoUpload" />
                </label>
              </div>

              <Separator />

              <!-- Accent color -->
              <div class="space-y-2">
                <Label class="text-sm font-medium">Accent color</Label>
                <div class="flex items-center gap-3">
                  <input
                    v-model="brandColor"
                    type="color"
                    class="h-9 w-16 cursor-pointer rounded border border-border p-0.5 bg-background"
                  />
                  <span class="font-mono text-sm text-muted-foreground">{{ brandColor }}</span>
                </div>
                <p class="text-xs text-muted-foreground">
                  Used on hosted payment pages and customer emails.
                </p>
              </div>

              <Separator />

              <!-- Icon upload -->
              <div class="space-y-2">
                <Label class="text-sm font-medium">Icon (small)</Label>
                <label
                  class="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors overflow-hidden"
                >
                  <img
                    v-if="iconPreview"
                    :src="iconPreview"
                    alt="Icon preview"
                    class="h-full w-full object-contain p-1"
                  />
                  <div v-else class="flex flex-col items-center gap-0.5 text-muted-foreground">
                    <Palette class="h-5 w-5 opacity-40" />
                    <span class="text-xs text-center leading-tight">Upload icon</span>
                  </div>
                  <input type="file" accept="image/*" class="hidden" @change="handleIconUpload" />
                </label>
                <p class="text-xs text-muted-foreground">Square image for favicon / app icon.</p>
              </div>

              <!-- Save button -->
              <div class="flex items-center gap-3 pt-2">
                <Button class="gap-2 min-w-36" @click="saveBranding">
                  <Check v-if="brandingSaved" class="h-4 w-4" />
                  <Save v-else class="h-4 w-4" />
                  {{ brandingSaved ? 'Saved!' : 'Save branding' }}
                </Button>
                <span v-if="brandingSaved" class="text-sm text-green-600">Branding saved.</span>
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
                <Button size="sm" class="gap-1.5 shrink-0" @click="teamInviteOpen = true">
                  <Users class="h-3.5 w-3.5" />
                  Invite member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <!-- Empty state -->
              <div
                v-if="teamMembers.length === 0"
                class="flex flex-col items-center justify-center py-12 text-center"
              >
                <Users class="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p class="text-sm font-medium text-foreground mb-1">Only you have access</p>
                <p class="text-sm text-muted-foreground">Invite team members to manage your account.</p>
              </div>

              <!-- Members list -->
              <ul v-else class="divide-y divide-border">
                <li
                  v-for="member in teamMembers"
                  :key="member.id"
                  class="flex items-center justify-between py-3"
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-medium text-foreground">{{ member.name }}</span>
                    <span class="text-xs text-muted-foreground">{{ member.email }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <Badge variant="secondary" class="text-xs">
                      {{ roleLabels[member.role] ?? member.role }}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                      @click="revokeMember(member.id)"
                    >
                      Revoke
                    </Button>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <!-- Invite dialog -->
          <Dialog v-model:open="teamInviteOpen">
            <DialogContent class="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new team member. They will receive an email to accept.
                </DialogDescription>
              </DialogHeader>
              <div class="space-y-4 py-2">
                <div class="space-y-1.5">
                  <Label for="invite-email" class="text-sm font-medium">Email address</Label>
                  <Input
                    id="invite-email"
                    v-model="inviteEmail"
                    type="email"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-sm font-medium">Role</Label>
                  <Select v-model="inviteRole">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrator">Administrator</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="read-only">Read-only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" @click="teamInviteOpen = false">Cancel</Button>
                <Button :disabled="!inviteEmail" @click="sendInvite">Send invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            <CardContent class="space-y-0">
              <div
                v-for="(item, index) in emailToggles"
                :key="item.key"
                class="flex items-center justify-between py-4"
                :class="index < emailToggles.length - 1 ? 'border-b border-border' : ''"
              >
                <div class="flex-1 mr-4">
                  <p class="text-sm font-medium text-foreground">{{ item.label }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ item.desc }}</p>
                </div>
                <!-- Toggle switch -->
                <label class="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    :checked="emailSettings[item.key]"
                    @change="emailSettings[item.key] = ($event.target as HTMLInputElement).checked"
                  />
                  <div
                    class="w-10 h-6 bg-muted rounded-full peer peer-checked:bg-blue-600 transition-colors
                           after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                           after:bg-white after:rounded-full after:h-5 after:w-5
                           after:transition-all peer-checked:after:translate-x-4 after:shadow-sm"
                  ></div>
                </label>
              </div>

              <!-- Save button -->
              <div class="flex items-center gap-3 pt-5">
                <Button class="gap-2 min-w-44" @click="saveEmailSettings">
                  <Check v-if="emailsSaved" class="h-4 w-4" />
                  <Save v-else class="h-4 w-4" />
                  {{ emailsSaved ? 'Saved!' : 'Save email settings' }}
                </Button>
                <span v-if="emailsSaved" class="text-sm text-green-600">Email settings saved.</span>
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
            <CardContent class="space-y-5">
              <!-- Current plan card -->
              <div class="rounded-lg border border-border p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold text-foreground">Starter</p>
                    <p class="text-2xl font-bold text-foreground mt-0.5">Free</p>
                  </div>
                  <Badge class="bg-green-100 text-green-700 border-green-200">Current plan</Badge>
                </div>
                <ul class="space-y-1.5">
                  <li
                    v-for="feature in starterFeatures"
                    :key="feature"
                    class="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check class="h-3.5 w-3.5 text-green-600 shrink-0" />
                    {{ feature }}
                  </li>
                </ul>
                <Button variant="outline" class="mt-1 w-full sm:w-auto" @click="upgradeClicked">
                  Upgrade to Professional
                </Button>
              </div>

              <Separator />

              <!-- Billing history -->
              <div class="space-y-3">
                <p class="text-sm font-medium text-foreground">Billing history</p>
                <div class="rounded-md border border-border overflow-hidden">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="bg-muted/50 border-b border-border">
                        <th class="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                        <th class="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Description</th>
                        <th class="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                        <th class="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(invoice, i) in billingHistory"
                        :key="i"
                        class="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td class="px-4 py-3 text-sm text-foreground">{{ invoice.date }}</td>
                        <td class="px-4 py-3 text-sm text-foreground">{{ invoice.description }}</td>
                        <td class="px-4 py-3 text-sm text-foreground">{{ invoice.amount }}</td>
                        <td class="px-4 py-3">
                          <Badge class="bg-green-100 text-green-700 border-green-200 text-xs">
                            {{ invoice.status }}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </template>

      </div>
    </div>
  </div>
</template>
