import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'

const clusters = [
  {
    name: 'São José · Kobrasol',
    personas: '47.800',
    calidad: 'Media-baja',
    congestion: 'Alta',
    riesgo: 'Alto',
    accion: 'Reforzar red · infraestructura primero',
    checked: true,
  },
  {
    name: 'Palhoça Centro',
    personas: '33.100',
    calidad: 'Baja',
    congestion: 'Media',
    riesgo: 'Alto',
    accion: 'Reforzar red · infraestructura primero',
    checked: true,
  },
  {
    name: 'Biguaçu · BR-101 Norte',
    personas: '21.500',
    calidad: 'Baja',
    congestion: 'Alta',
    riesgo: 'Alto',
    accion: 'Corredor con gargalo · priorizar',
    checked: false,
  },
  {
    name: 'Centro Histórico',
    personas: '61.200',
    calidad: 'Media',
    congestion: 'Alta',
    riesgo: 'Medio',
    accion: 'Descongestionar en hora pico',
    checked: false,
  },
  {
    name: 'Campeche',
    personas: '38.700',
    calidad: 'Estimada baja',
    congestion: 'Baja',
    riesgo: 'Medio',
    accion: 'Monitorear estacionalidad',
    checked: false,
  },
]

const riskInfo = 'Score calculado a partir de concentración, congestión, movilidad y conectividad.'

export default function ClusterTable() {
  const [selected, setSelected] = useState([])

  const toggle = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E4DF] bg-white shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F5F6F4]">
            <TableHead className="w-10 px-3 py-2.5"></TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Zona</TableHead>
            <TableHead className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Personas</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Red</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Congestión</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Riesgo</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clusters.map((c) => (
            <TableRow key={c.name}>
              <TableCell className="px-3 py-2.5">
                <Checkbox
                  checked={selected.includes(c.name)}
                  onCheckedChange={() => toggle(c.name)}
                  className="data-[state=checked]:border-[#564C8E] data-[state=checked]:bg-[#564C8E] data-[state=checked]:text-white data-[state=checked]:[&>svg]:text-white"
                />
              </TableCell>
              <TableCell className="px-3 py-2.5 text-xs font-medium">{c.name}</TableCell>
              <TableCell className="px-3 py-2.5 text-right text-xs">{c.personas}</TableCell>
              <TableCell className="px-3 py-2.5 text-xs">{c.calidad}</TableCell>
              <TableCell className="px-3 py-2.5 text-xs">{c.congestion}</TableCell>
              <TableCell className="px-3 py-2.5 text-xs">
                <div className="flex items-center gap-1">
                  {c.riesgo === 'Alto' ? (
                    <Badge variant="outline" className="inline-flex items-center gap-1 border-red-300 bg-red-50 text-red-700 rounded-full px-2 py-0.5 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Alto
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="inline-flex items-center gap-1 border-yellow-300 bg-yellow-50 text-yellow-700 rounded-full px-2 py-0.5 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      Medio
                    </Badge>
                  )}
                  <span className="group relative inline-flex cursor-help">
                    <Info className="h-3 w-3 text-gray-400" />
                    <span className="absolute bottom-full left-1/2 z-10 mb-1 w-48 -translate-x-1/2 rounded-md border bg-white px-2 py-1 text-[11px] text-gray-600 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      Riesgo calculado.<br />{riskInfo}
                    </span>
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-3 py-2.5 text-xs">
                <span className="text-gray-700">{c.accion}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
