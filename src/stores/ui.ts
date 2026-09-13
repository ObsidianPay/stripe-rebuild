import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const testMode = ref(true)
  const sidebarCollapsed = ref(false)

  function toggleTestMode() {
    testMode.value = !testMode.value
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    testMode,
    sidebarCollapsed,
    toggleTestMode,
    toggleSidebar,
  }
})
