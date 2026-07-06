import { create } from 'zustand'
import { buildClusterDetail } from '../lib/clusterDetail'

const useMapPageStore = create((set, get) => ({
  // Selected cluster for detail sheet
  selectedCluster: null,

  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  clearSelectedCluster: () => set({ selectedCluster: null }),

  // Opens the detail sheet for the highest-risk cluster from the loaded API data
  openRecommendedClusterDetail: () => {
    const { clusterProperties, demografiaData } = get()
    if (!clusterProperties) return

    const allProps = Object.values(clusterProperties)
    if (allProps.length === 0) return

    const top = allProps.reduce((a, b) =>
      (b.score_riesgo ?? 0) > (a.score_riesgo ?? 0) ? b : a
    )
    const demo = demografiaData?.clusters?.[top.cluster]

    set({
      selectedCluster: buildClusterDetail(top.cluster, demo, top),
      chatContext: { region: top.cluster },
    })
  },

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
