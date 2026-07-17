import { computed, onMounted, ref } from 'vue'

const PREVIEW_STORAGE_KEY = 'tranquility-preview-features'

const enabledFeatures = ref<Set<string>>(new Set())

export function usePreviewFeatures() {
  onMounted(() => {
    // Check for query parameter
    const params = new URLSearchParams(window.location.search)
    const previewParam = params.get('preview')

    if (previewParam) {
      const features = previewParam.split(',').map((f) => f.trim())
      features.forEach((feature) => enabledFeatures.value.add(feature))

      // Persist to localStorage
      localStorage.setItem(PREVIEW_STORAGE_KEY, Array.from(enabledFeatures.value).join(','))
    } else {
      // Load from localStorage if no query param
      const stored = localStorage.getItem(PREVIEW_STORAGE_KEY)
      if (stored) {
        stored.split(',').forEach((feature) => enabledFeatures.value.add(feature))
      }
    }
  })

  const isGw2PreviewEnabled = computed(() => enabledFeatures.value.has('gw2'))

  const clearPreview = () => {
    enabledFeatures.value.clear()
    localStorage.removeItem(PREVIEW_STORAGE_KEY)
  }

  const toggleFeature = (feature: string) => {
    if (enabledFeatures.value.has(feature)) {
      enabledFeatures.value.delete(feature)
    } else {
      enabledFeatures.value.add(feature)
    }
    localStorage.setItem(PREVIEW_STORAGE_KEY, Array.from(enabledFeatures.value).join(','))
  }

  return {
    isGw2PreviewEnabled,
    clearPreview,
    toggleFeature,
  }
}
