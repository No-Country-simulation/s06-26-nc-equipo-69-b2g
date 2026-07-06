import { create } from 'zustand'
import { buildClusterDetail } from '../lib/clusterDetail'

const useMapPageStore = create((set, get) => ({
  // Selected cluster for detail sheet
  selectedCluster: null,

  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  clearSelectedCluster: () => set({ selectedCluster: null }),

  // Live Mapbox instance (set by MapboxMap on load) for flyTo from search
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),

  // Select a zone by cluster name: open its detail sheet and fly the map to it
  selectZone: (clusterName) => {
    const { clusterProperties, demografiaData, mapInstance } = get()
    const props = clusterProperties?.[clusterName]
    if (!props) return

    const demo = demografiaData?.clusters?.[clusterName]
    set({
      selectedCluster: buildClusterDetail(clusterName, demo, props),
      chatContext: { region: clusterName },
    })

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
  setChatContext: (context) => set({ chatContext: context }),
  clearChatContext: () => set({ chatContext: null }),

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

  // Active filters on the map. Only risk bubbles and the heatmap start
  // visible; antenas and corredores are opt-in toggles to avoid clutter.
  activeFilters: ['concentracion', 'clusters'],
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
