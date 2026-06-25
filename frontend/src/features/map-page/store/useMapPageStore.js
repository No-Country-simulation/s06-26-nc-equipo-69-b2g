import { create } from 'zustand'
import { mockCluster } from '../data/mockCluster'

const useMapPageStore = create((set) => ({
  // Selected cluster for detail sheet
  selectedCluster: null,

  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  openMockClusterDetail: () => set({ selectedCluster: mockCluster }),
  clearSelectedCluster: () => set({ selectedCluster: null }),

  // Left sidebar
  isLeftSidebarOpen: false,
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),

  // Active filters on the map
  activeFilters: ['concentracion', 'antenas', 'clusters', 'calidad', 'flujos', 'corredores', 'riesgo'],
  toggleFilter: (filterId) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(filterId)
        ? state.activeFilters.filter((f) => f !== filterId)
        : [...state.activeFilters, filterId],
    })),
}))

export default useMapPageStore
