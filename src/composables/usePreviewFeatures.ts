import { computed, onMounted, ref } from 'vue'

const PREVIEW_STORAGE_KEY = 'tranquility-preview-features'

const enabledFeatures = ref<Set<string>>(new Set())

export function usePreviewFeatures() {
  onMounted(() => {
    enabledFeatures.value.clear()

    // Use URL query parameter only (no persisted preview state).
    const params = new URLSearchParams(window.location.search)
    const previewParam = params.get('preview')

    if (!previewParam) {
      localStorage.removeItem(PREVIEW_STORAGE_KEY)
      return
    }

    const features = previewParam
      .split(',')
      .map((feature) => feature.trim().toLowerCase())
      .filter((feature) => feature.length > 0)

    features.forEach((feature) => enabledFeatures.value.add(feature))

    // Remove stale persisted preview flags from older behavior.
    localStorage.removeItem(PREVIEW_STORAGE_KEY)
  })

  const isFeatureEnabled = (feature: string) => {
    return enabledFeatures.value.has(feature)
  }

  const isGw2PreviewEnabled = computed(() => isFeatureEnabled('gw2'))
  const isPoE2PreviewEnabled = computed(() => isFeatureEnabled('poe2'))

  const clearPreview = () => {
    enabledFeatures.value.clear()
    const params = new URLSearchParams(window.location.search)
    params.delete('preview')

    const nextQuery = params.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)

    localStorage.removeItem(PREVIEW_STORAGE_KEY)
  }

  const toggleFeature = (feature: string) => {
    const normalizedFeature = feature.trim().toLowerCase()
    if (!normalizedFeature) {
      return
    }

    if (enabledFeatures.value.has(normalizedFeature)) {
      enabledFeatures.value.delete(normalizedFeature)
    } else {
      enabledFeatures.value.add(normalizedFeature)
    }

    const params = new URLSearchParams(window.location.search)
    if (enabledFeatures.value.size > 0) {
      params.set('preview', Array.from(enabledFeatures.value).join(','))
    } else {
      params.delete('preview')
    }

    const nextQuery = params.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)

    localStorage.removeItem(PREVIEW_STORAGE_KEY)
  }

  return {
    isGw2PreviewEnabled,
    isPoE2PreviewEnabled,
    isFeatureEnabled,
    clearPreview,
    toggleFeature,
  }
}
