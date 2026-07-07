import { create } from 'zustand'
import { buildClusterDetail } from '../lib/clusterDetail'

const uniqueRegions = (regions) => [...new Set((regions ?? []).filter(Boolean))]

const contextWithRegions = (regions) => {
  const nextRegions = uniqueRegions(regions)
  if (nextRegions.length === 0) return null
  return { regions: nextRegions, region: nextRegions[0] }
}

const getContextRegions = (context) => uniqueRegions([...(context?.regions ?? []), context?.region])

const MAX_OPEN_ZONES = 6

const useMapPageStore = create((set, get) => ({
  // Multi-zone detail: browser-like tabs along the bottom. `openZones` holds the
  // detail view models (keyed by `code`) — one tab each. `expandedZoneIds` are
  // the tabs whose card is deployed upward; several can be open at once.
  openZones: [],
  expandedZoneIds: [],

  openZone: (detail) => {
    if (!detail?.code) return
    set((state) => {
      const exists = state.openZones.some((zone) => zone.code === detail.code)
      let openZones = exists
        ? state.openZones.map((zone) => (zone.code === detail.code ? detail : zone))
        : [...state.openZones, detail]
      if (openZones.length > MAX_OPEN_ZONES) {
        openZones = openZones.slice(openZones.length - MAX_OPEN_ZONES)
      }
      const codes = new Set(openZones.map((zone) => zone.code))
      const expandedZoneIds = state.expandedZoneIds.filter((code) => codes.has(code))
      if (!expandedZoneIds.includes(detail.code)) expandedZoneIds.push(detail.code)
      return { openZones, expandedZoneIds }
    })
  },
  toggleZoneExpanded: (code) =>
    set((state) => ({
      expandedZoneIds: state.expandedZoneIds.includes(code)
        ? state.expandedZoneIds.filter((id) => id !== code)
        : [...state.expandedZoneIds, code],
    })),
  collapseZone: (code) =>
    set((state) => ({ expandedZoneIds: state.expandedZoneIds.filter((id) => id !== code) })),
  closeZone: (code) =>
    set((state) => ({
      openZones: state.openZones.filter((zone) => zone.code !== code),
      expandedZoneIds: state.expandedZoneIds.filter((id) => id !== code),
    })),
  clearZones: () => set({ openZones: [], expandedZoneIds: [] }),

  // Live Mapbox instance (set by MapboxMap on load) for flyTo from search
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),

  // Select a zone by cluster name: open its detail sheet and fly the map to it
  selectZone: (clusterName) => {
    const { clusterProperties, demografiaData, mapInstance, isLeftSidebarOpen } = get()
    const props = clusterProperties?.[clusterName]
    if (!props) return

    const demo = demografiaData?.clusters?.[clusterName]
    get().openZone(buildClusterDetail(clusterName, demo, props))
    // Only feed the chat context when the chat is open (see mapLayers selectCluster).
    if (isLeftSidebarOpen) {
      const regions = uniqueRegions([...getContextRegions(get().chatContext), clusterName])
      set({ chatContext: contextWithRegions(regions), highlightedClusters: regions })
    }

    if (mapInstance && props.lng != null && props.lat != null) {
      mapInstance.flyTo({ center: [props.lng, props.lat], zoom: 12.5, duration: 1200 })
    }
  },

  // First-visit onboarding tour
  isOnboardingOpen: !window.localStorage.getItem('bit-map-onboarding-seen'),
  openOnboarding: () => set({ isOnboardingOpen: true }),
  closeOnboarding: () => {
    window.localStorage.setItem('bit-map-onboarding-seen', '1')
    set({ isOnboardingOpen: false })
  },

  // Left sidebar (chat)
  isLeftSidebarOpen: false,
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  openLeftSidebar: () => set({ isLeftSidebarOpen: true }),

  // Chat context from map clicks (region or ecgi)
  chatContext: null,
  setChatContext: (context) => {
    if (!context) {
      set({ chatContext: null, highlightedClusters: [] })
      return
    }

    if (context.region) {
      const regions = uniqueRegions([...getContextRegions(get().chatContext), context.region])
      set({ chatContext: contextWithRegions(regions), highlightedClusters: regions })
      return
    }

    if (context.regions?.length) {
      const regions = uniqueRegions(context.regions)
      set({ chatContext: contextWithRegions(regions), highlightedClusters: regions })
      return
    }

    set({ chatContext: context, highlightedClusters: [] })
  },
  clearChatContext: () => set({ chatContext: null, highlightedClusters: [] }),
  addChatRegion: (region) => {
    const regions = uniqueRegions([...getContextRegions(get().chatContext), region])
    set({ chatContext: contextWithRegions(regions), highlightedClusters: regions })
  },
  removeChatRegion: (region) => {
    const regions = getContextRegions(get().chatContext).filter((name) => name !== region)
    set({ chatContext: contextWithRegions(regions), highlightedClusters: regions })
  },
  setChatRegions: (regions) => {
    const nextRegions = uniqueRegions(regions)
    set({ chatContext: contextWithRegions(nextRegions), highlightedClusters: nextRegions })
  },

  // Zones highlighted by the AI (clusters_destacados from POST /datos).
  // Empty array clears the highlight. When zones arrive, the map makes the
  // zones layer visible and flies to frame them.
  highlightedClusters: [],
  setHighlightedClusters: (names) => {
    const highlighted = names ?? []
    set({ highlightedClusters: highlighted })
    if (highlighted.length === 0) return

    const { clusterProperties, mapInstance, activeFilters } = get()

    if (!activeFilters.includes('clusters')) {
      set({ activeFilters: [...activeFilters, 'clusters'] })
    }

    if (!mapInstance || !clusterProperties) return
    const coords = highlighted
      .map((name) => clusterProperties[name])
      .filter((p) => p?.lng != null && p?.lat != null)
      .map((p) => [p.lng, p.lat])
    if (coords.length === 0) return

    if (coords.length === 1) {
      mapInstance.flyTo({ center: coords[0], zoom: 11.5, duration: 1400 })
      return
    }

    const lngs = coords.map((c) => c[0])
    const lats = coords.map((c) => c[1])
    mapInstance.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 90, duration: 1400, maxZoom: 12 }
    )
  },

  // Active filters on the map. Risk bubbles, the heatmap and public
  // institutions start visible; antenas and corredores are opt-in toggles
  // to avoid clutter.
  activeFilters: ['concentracion', 'clusters', 'instituciones'],
  toggleFilter: (filterId) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(filterId)
        ? state.activeFilters.filter((f) => f !== filterId)
        : [...state.activeFilters, filterId],
    })),

  // Selected period for concentracao API
  selectedPeriodo: 'MANHA',
  setSelectedPeriodo: (periodo) => set({ selectedPeriodo: periodo }),

  // Cached demografia data (keyed by cluster name)
  demografiaData: null,
  setDemografiaData: (data) => set({ demografiaData: data }),

  // Cached cluster properties from /api/v1/mapa/clusters (keyed by cluster name)
  clusterProperties: null,
  setClusterProperties: (data) => set({ clusterProperties: data }),
}))

export default useMapPageStore
