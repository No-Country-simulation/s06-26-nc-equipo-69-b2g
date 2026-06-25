import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AiChatPanel, MobileAiChatSheet } from '@/features/ai-chat'
import useMapPageStore from '../store/useMapPageStore'
import ClusterDetailSheet from './ClusterDetailSheet'
import MapboxMap from './MapboxMap'
import MapControlsGroup from './MapControlsGroup'
import MapLegend from './MapLegend'

export default function MapPageShell() {
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const isLeftSidebarOpen = useMapPageStore((s) => s.isLeftSidebarOpen)
  const toggleLeftSidebar = useMapPageStore((s) => s.toggleLeftSidebar)
  const openMockClusterDetail = useMapPageStore((s) => s.openMockClusterDetail)

  return (
    <main className="relative h-[calc(100dvh-3.5rem)] min-h-[420px] flex-1 overflow-hidden bg-gray-100 md:h-[calc(100dvh-3rem)]">
      <MapboxMap />

      <AiChatPanel
        isOpen={isLeftSidebarOpen}
        onToggle={toggleLeftSidebar}
        onOpenRecommendedCluster={openMockClusterDetail}
      />
      <MobileAiChatSheet
        open={isMobileChatOpen}
        onOpenChange={setIsMobileChatOpen}
        onOpenRecommendedCluster={openMockClusterDetail}
      />

      <MapControlsGroup
        className="left-3 right-3 md:left-4 md:right-auto"
      />
      <MapLegend className="left-3 md:left-4" />

      <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex justify-end md:hidden">
        <div className="pointer-events-auto rounded-full bg-purple-500/20 p-1 shadow-[0_16px_40px_rgba(76,29,149,0.25)] backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsMobileChatOpen(true)}
            className="flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-gradient-to-br from-purple-500 via-purple-700 to-slate-950 px-4 text-xs font-bold text-white shadow-lg ring-1 ring-purple-200/40 transition-transform active:scale-95"
            aria-label="Abrir asistente IA"
          >
            <Sparkles className="h-4 w-4" />
            IA
          </button>
        </div>
      </div>

      <ClusterDetailSheet />
    </main>
  )
}
