import { computed, ref } from 'vue'
import type { CanastaTabId, HandTabId } from '@/types/canasta'

export function useCanastaTabs(initialTab: CanastaTabId = 'hand1') {
  const activeTab = ref<CanastaTabId>(initialTab)

  const activeHandTab = computed<HandTabId | null>(() => {
    return activeTab.value === 'totals' ? null : (activeTab.value as HandTabId)
  })

  function setActiveTab(tabId: CanastaTabId) {
    activeTab.value = tabId
  }

  return {
    activeTab,
    activeHandTab,
    setActiveTab,
  }
}
