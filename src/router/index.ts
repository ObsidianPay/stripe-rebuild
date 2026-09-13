import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { layout: 'dashboard' },
    children: [
      {
        path: 'dashboard',
        name: 'home',
        component: () => import('@/pages/HomePage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'payments',
        name: 'payments',
        component: () => import('@/pages/PaymentsPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'payments/:id',
        name: 'payment-detail',
        component: () => import('@/pages/PaymentDetailPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'customers',
        name: 'customers',
        component: () => import('@/pages/CustomersPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'customers/:id',
        name: 'customer-detail',
        component: () => import('@/pages/CustomerDetailPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'subscriptions',
        name: 'subscriptions',
        component: () => import('@/pages/SubscriptionsPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'subscriptions/:id',
        name: 'subscription-detail',
        component: () => import('@/pages/SubscriptionDetailPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'invoices',
        name: 'invoices',
        component: () => import('@/pages/InvoicesPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'invoices/:id',
        name: 'invoice-detail',
        component: () => import('@/pages/InvoiceDetailPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/pages/ProductsPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'payment-links',
        name: 'payment-links',
        component: () => import('@/pages/PaymentLinksPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'balance',
        name: 'balance',
        component: () => import('@/pages/BalancePage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/pages/ReportsPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'developers',
        name: 'developers',
        component: () => import('@/pages/DevelopersPage.vue'),
        meta: { layout: 'dashboard' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/pages/SettingsPage.vue'),
        meta: { layout: 'dashboard' },
      },
    ],
  },
  {
    path: '/checkout/:sessionId',
    name: 'checkout',
    component: () => import('@/pages/CheckoutPage.vue'),
    meta: { layout: 'standalone' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
