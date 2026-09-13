<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { checkoutApi, type CheckoutSession } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Lock, ChevronDown, Check, AlertCircle } from 'lucide-vue-next'

const route = useRoute()
const session = ref<CheckoutSession | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const paying = ref(false)
const paid = ref(false)

const email = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvc = ref('')
const nameOnCard = ref('')
const country = ref('US')

onMounted(async () => {
  try {
    session.value = await checkoutApi.getSession(route.params.sessionId as string)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load checkout session'
  } finally {
    loading.value = false
  }
})

function onCardInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 16)
  cardNumber.value = raw.replace(/(.{4})/g, '$1 ').trim()
}
function onExpiryInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 4)
  cardExpiry.value = digits.length >= 3 ? `${digits.substring(0, 2)} / ${digits.substring(2)}` : digits
}
function onCvcInput(e: Event) {
  cardCvc.value = (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 4)
}

const isFormValid = computed(() =>
  email.value.includes('@') &&
  cardNumber.value.replace(/\s/g, '').length === 16 &&
  cardExpiry.value.length >= 7 &&
  cardCvc.value.length >= 3 &&
  nameOnCard.value.trim().length > 1
)

async function handlePay() {
  if (!isFormValid.value) return
  paying.value = true
  await new Promise(r => setTimeout(r, 1800))
  paid.value = true
  paying.value = false
}

interface SessionExtra { amount_total?: number; currency?: string; description?: string }
const amount = computed(() => ((session.value as unknown as SessionExtra)?.amount_total ?? 999))
const currency = computed(() => ((session.value as unknown as SessionExtra)?.currency ?? 'usd'))
const productName = computed(() => ((session.value as unknown as SessionExtra)?.description ?? 'Payment'))
</script>

<template>
  <div class="min-h-screen bg-muted/30 flex items-center justify-center p-4">
    <div v-if="loading" class="text-center space-y-3">
      <div class="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p class="text-sm text-muted-foreground">Loading checkout...</p>
    </div>

    <div v-else-if="error" class="bg-white rounded-xl shadow p-8 max-w-sm w-full text-center space-y-3">
      <AlertCircle class="h-10 w-10 text-destructive mx-auto" />
      <p class="font-medium">Unable to load checkout</p>
      <p class="text-sm text-muted-foreground">{{ error }}</p>
    </div>

    <div v-else-if="paid" class="bg-white rounded-xl shadow-lg p-10 max-w-sm w-full text-center space-y-4">
      <div class="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check class="h-8 w-8 text-green-600" />
      </div>
      <h2 class="text-xl font-semibold">Payment successful</h2>
      <p class="text-sm text-muted-foreground">
        Thank you! Your payment of {{ formatCurrency(amount, currency) }} has been received.
      </p>
      <p class="text-xs text-muted-foreground">A receipt has been sent to {{ email }}</p>
    </div>

    <div v-else-if="session" class="w-full max-w-3xl">
      <div class="grid md:grid-cols-5 gap-0 bg-white rounded-xl shadow-xl overflow-hidden">
        <!-- Order summary -->
        <div class="md:col-span-2 bg-muted/50 p-8 flex flex-col">
          <div class="mb-6">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard class="h-5 w-5 text-primary" />
            </div>
            <h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pay to</h2>
            <p class="font-semibold text-foreground">My Account</p>
          </div>
          <Separator class="mb-6" />
          <div class="flex justify-between items-start flex-1">
            <div>
              <p class="font-medium text-sm">{{ productName }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">Qty 1</p>
            </div>
            <p class="font-medium text-sm">{{ formatCurrency(amount, currency) }}</p>
          </div>
          <Separator class="my-6" />
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Subtotal</span>
              <span>{{ formatCurrency(amount, currency) }}</span>
            </div>
            <div class="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{{ formatCurrency(amount, currency) }}</span>
            </div>
          </div>
          <div class="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock class="h-3 w-3" />
            <span>Secured checkout</span>
          </div>
        </div>

        <!-- Payment form -->
        <div class="md:col-span-3 p-8">
          <h2 class="text-lg font-semibold mb-6">Payment details</h2>
          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label for="email">Email</Label>
              <Input id="email" v-model="email" type="email" placeholder="you@example.com" autocomplete="email" />
            </div>

            <div class="space-y-1.5">
              <Label for="card-number">Card number</Label>
              <div class="relative">
                <Input id="card-number" :value="cardNumber" placeholder="1234 5678 9012 3456" inputmode="numeric" autocomplete="cc-number" @input="onCardInput" />
                <CreditCard class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label for="expiry">Expiration</Label>
                <Input id="expiry" :value="cardExpiry" placeholder="MM / YY" inputmode="numeric" autocomplete="cc-exp" @input="onExpiryInput" />
              </div>
              <div class="space-y-1.5">
                <Label for="cvc">Security code</Label>
                <Input id="cvc" :value="cardCvc" placeholder="CVC" inputmode="numeric" autocomplete="cc-csc" maxlength="4" @input="onCvcInput" />
              </div>
            </div>

            <div class="space-y-1.5">
              <Label for="name">Name on card</Label>
              <Input id="name" v-model="nameOnCard" placeholder="Full name" autocomplete="cc-name" />
            </div>

            <div class="space-y-1.5">
              <Label for="country">Country</Label>
              <div class="relative">
                <select id="country" v-model="country" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
                <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <Button class="w-full mt-2" :disabled="!isFormValid || paying" @click="handlePay">
              <span v-if="paying" class="flex items-center gap-2">
                <span class="h-4 w-4 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </span>
              <span v-else class="flex items-center gap-2">
                <Lock class="h-3.5 w-3.5" />
                Pay {{ formatCurrency(amount, currency) }}
              </span>
            </Button>

            <p class="text-center text-xs text-muted-foreground">
              By confirming your payment you allow this merchant to charge your card.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
