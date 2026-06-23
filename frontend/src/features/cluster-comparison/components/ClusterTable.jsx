import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ClusterTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cluster</TableHead>
          <TableHead>Incidentes</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Cluster 1</TableCell>
          <TableCell>12</TableCell>
          <TableCell>Activo</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Cluster 2</TableCell>
          <TableCell>8</TableCell>
          <TableCell>Inactivo</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
