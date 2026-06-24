import { create } from 'zustand'

const useAppStore = create((set) => ({
  // Selected cluster for right sidebar detail
  selectedCluster: {
    id: 'sao_jose_kobrasol',
    name: 'São José · Kobrasol',
    code: 'SAO_JOSE_KOBRASOL',
    type: 'zona',
    subtype: 'RMF',
    riskLevel: 'alto',
    riskLabel: 'Riesgo alto de exclusión digital',
    indicators: {
      concentracion: { value: '47.800', trend: '▲ 4,8% intra-ventana', label: 'Concentración (pico)' },
      conectividad: { value: 'Media-baja', sublabel: 'modelo CDRView', label: 'Conectividad estimada' },
      congestion: { value: 'Alta', sublabel: 'pico 18-20 h', label: 'Congestión de red' },
      tecnologia: { value: '4G', sublabel: '6 ERBs activas', label: 'Tecnología predominante' },
    },
    movilidad: {
      flujoOD: { value: '18.400', unit: '/d', source: 'CDRView' },
      corredor: { value: 'BR-101', tag: 'gargalo' },
      antenas: { value: '6', source: 'Anatel' },
    },
    porQueImporta: 'São José · Kobrasol combina una de las mayores concentraciones diurnas de la región metropolitana con conectividad estimada baja y congestión alta en hora pico. Los programas digitales remotos tendrían alcance limitado sin reforzar primero la red.',
    recomendacion: 'Reforzar capacidad de red (descongestión + ERBs adicionales) antes de desplegar programas digitales remotos en el cluster.',
  },

  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  clearSelectedCluster: () => set({ selectedCluster: null }),

  // Left sidebar
  isLeftSidebarOpen: true,
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

export default useAppStore
