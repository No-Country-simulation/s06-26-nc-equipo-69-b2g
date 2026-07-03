import { create } from 'zustand'
import { mockCluster } from '../data/mockCluster'

const useMapPageStore = create((set) => ({
  // Selected cluster for detail sheet
  selectedCluster: null,

  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  openMockClusterDetail: () => set({ selectedCluster: mockCluster }),
  clearSelectedCluster: () => set({ selectedCluster: null }),

  // Left sidebar (chat)
  isLeftSidebarOpen: false,
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  openLeftSidebar: () => set({ isLeftSidebarOpen: true }),

  // Chat context from map clicks (region or ecgi)
  chatContext: null,
  setChatContext: (context) => set({ chatContext: context }),
  clearChatContext: () => set({ chatContext: null }),

  // Active filters on the map
  activeFilters: ['concentracion', 'antenas', 'clusters', 'calidad', 'flujos', 'corredores', 'riesgo'],
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
