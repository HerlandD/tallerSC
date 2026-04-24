import { useState, useEffect, useMemo } from 'react'
import { useApp, OrdenTrabajo } from '../context/AppContext'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Calendar, Truck, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const ESTADOS = [
  { value: 'registrada', label: 'Registrada' },
  { value: 'en_diagnostico', label: 'En Diagnóstico' },
  { value: 'en_reparacion', label: 'En Reparación' },
  { value: 'control_calidad', label: 'QC' },
  { value: 'liberada', label: 'Liberada' },
  { value: 'finalizada', label: 'Finalizada' }
]

interface DetalleOrdenModalProps {
  isOpen: boolean
  orden: OrdenTrabajo | null
  onClose: () => void
  onCerrar: () => void
}

function DetalleOrdenModal({ isOpen, orden, onClose, onCerrar }: DetalleOrdenModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  if (!orden) return null

  let pagoPendiente = true
  let estadoTexto = 'Pago Pendiente'

  if (orden.estado === 'liberada') {
    pagoPendiente = orden.factura?.estado !== 'pagada'
    estadoTexto = !pagoPendiente ? 'Pagado' : 'Pago Pendiente (Factura)'
  } else if (orden.estado === 'liquidacion_diagnostico') {
    pagoPendiente = orden.cobroDiagnostico?.estado !== 'pagado'
    estadoTexto = !pagoPendiente ? 'Cobro Confirmado' : 'Cobro Pendiente (Diagnóstico)'
  } else {
    pagoPendiente = true
    estadoTexto = 'No cerrable'
  }

  const handleCerrarOrden = async () => {
    setIsClosing(true)
    try {
      await onCerrar()
      onClose()
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle de Orden #{orden.numero}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <p className="text-lg capitalize">{orden.estado?.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Estado de Pago</p>
              <Badge variant={pagoPendiente ? 'secondary' : 'default'}>
                {estadoTexto}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-gray-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-600">Vehículo</p>
                <p className="text-lg">{orden.vehiculo?.placa}</p>
                <p className="text-sm text-gray-600">{orden.vehiculo?.marca} {orden.vehiculo?.modelo}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-600">Cliente</p>
                <p className="text-lg">{orden.cliente?.nombre}</p>
                <p className="text-sm text-gray-600">{orden.cliente?.telefono}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha de Creación</p>
                <p className="text-lg">{new Date(orden.fechaCreacion).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {pagoPendiente && (
            <div className="border-t pt-4 flex gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">No se puede cerrar la orden mientras el pago esté pendiente.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            disabled={pagoPendiente || isClosing}
            onClick={handleCerrarOrden}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isClosing ? 'Cerrando...' : 'Cerrar Orden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function WorkOrders() {
  const { ordenes, cargarOrdenesPorEstado, cerrarOrden, currentUser } = useApp()
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string | null>(null)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null)
  const [isLoadingCierre, setIsLoadingCierre] = useState(false)

  useEffect(() => {
    if (estadoSeleccionado) {
      cargarOrdenesPorEstado(estadoSeleccionado)
    }
  }, [estadoSeleccionado, cargarOrdenesPorEstado])

  const ordenesFiltradas = useMemo(() => {
    if (!estadoSeleccionado) {
      return ordenes || []
    }
    return (ordenes || []).filter((o: OrdenTrabajo) => o.estado === estadoSeleccionado)
  }, [ordenes, estadoSeleccionado])

  const handleCerrarOrden = async () => {
    if (!ordenSeleccionada || currentUser?.rol !== 'asesor') {
      toast.error('No autorizado para cerrar órdenes')
      return
    }

    setIsLoadingCierre(true)
    try {
      await cerrarOrden(ordenSeleccionada.id)
      toast.success('Orden cerrada exitosamente')
      setOrdenSeleccionada(null)
      if (estadoSeleccionado) {
        await cargarOrdenesPorEstado(estadoSeleccionado)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cerrar la orden')
    } finally {
      setIsLoadingCierre(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <p className="text-gray-600 mt-1">Gestiona y filtra órdenes por estado</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={estadoSeleccionado === null ? 'default' : 'outline'}
          onClick={() => setEstadoSeleccionado(null)}
        >
          Todas
        </Button>
        {ESTADOS.map(estado => (
          <Button
            key={estado.value}
            variant={estadoSeleccionado === estado.value ? 'default' : 'outline'}
            onClick={() => setEstadoSeleccionado(estado.value)}
          >
            {estado.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {ordenesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay órdenes en este estado</p>
          </div>
        ) : (
          ordenesFiltradas.map((orden: OrdenTrabajo) => (
            <div
              key={orden.id}
              onClick={() => setOrdenSeleccionada(orden)}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">Orden #{orden.numero}</h3>
                  <p className="text-sm text-gray-600 capitalize">{orden.estado?.replace(/_/g, ' ')}</p>
                </div>
                <Badge variant="outline">
                  {orden.factura?.estado === 'pagada' ? 'Pagado' : 'Pendiente'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Cliente</p>
                  <p className="font-medium">{orden.cliente?.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-600">Vehículo</p>
                  <p className="font-medium">{orden.vehiculo?.placa}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <DetalleOrdenModal
        isOpen={!!ordenSeleccionada}
        orden={ordenSeleccionada}
        onClose={() => setOrdenSeleccionada(null)}
        onCerrar={handleCerrarOrden}
      />
    </div>
  )
}
