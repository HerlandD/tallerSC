import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Plus, GripVertical, Edit2, Trash2, ChevronRight, ChevronDown,
  Circle, CheckCircle2, AlertCircle, Clock, Sparkles, Users, Car,
  ClipboardList, Package, Target, ListTodo, PlayCircle, CheckSquare
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Status = 'backlog' | 'todo' | 'in_progress' | 'done';
type Priority = 'Alta' | 'Media' | 'Baja';
type EpicId = 'E1' | 'E2' | 'E3' | 'E4';

interface UserStory {
  id: string;
  code: string;
  title: string;
  description: string;
  epicId: EpicId;
  priority: Priority;
  points: number;
  status: Status;
  sprint?: string;
  acceptanceCriteria: string[];
}

interface Epic {
  id: EpicId;
  code: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const EPICS: Epic[] = [
  {
    id: 'E1',
    code: 'TPRO-E1',
    title: 'Gestión de Clientes, Vehículos y Citas',
    icon: <Users size={16} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'E2',
    code: 'TPRO-E2',
    title: 'Gestión de Órdenes de Trabajo',
    icon: <ClipboardList size={16} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'E3',
    code: 'TPRO-E3',
    title: 'Gestión de Inventario y Repuestos',
    icon: <Package size={16} />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  {
    id: 'E4',
    code: 'TPRO-E4',
    title: 'Reportes y Configuración',
    icon: <Target size={16} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
];

const INITIAL_STORIES: UserStory[] = [
  {
    id: 's001',
    code: 'US-001',
    title: 'Registrar nuevo cliente',
    description: 'Como Asesor de Servicio, quiero registrar un nuevo cliente con sus datos personales completos para poder vincularle vehículos y crear órdenes de trabajo.',
    epicId: 'E1',
    priority: 'Alta',
    points: 5,
    status: 'backlog',
    acceptanceCriteria: [
      'El CI/cédula debe ser único entre clientes activos',
      'El email debe pasar validación de formato',
      'El teléfono debe tener mínimo 7 dígitos',
    ],
  },
  {
    id: 's002',
    code: 'US-002',
    title: 'Editar datos de cliente',
    description: 'Como Asesor, quiero editar los datos de un cliente existente para mantener la información actualizada sin perder su historial.',
    epicId: 'E1',
    priority: 'Alta',
    points: 3,
    status: 'backlog',
    acceptanceCriteria: [
      'El formulario pre-carga todos los datos actuales',
      'Validar CI único al cambiar',
      'Los cambios quedan registrados con timestamp',
    ],
  },
  {
    id: 's003',
    code: 'US-003',
    title: 'Desactivar cliente (soft-delete)',
    description: 'Como Asesor, quiero desactivar un cliente que ya no opera con el taller para que no aparezca en búsquedas activas.',
    epicId: 'E1',
    priority: 'Alta',
    points: 2,
    status: 'todo',
    acceptanceCriteria: [
      'Solicita confirmación antes de ejecutar',
      'El cliente no aparece en búsquedas de nuevas OTs',
      'Historial sigue visible para Admin',
    ],
  },
  {
    id: 's011',
    code: 'US-011',
    title: 'Crear Orden de Trabajo',
    description: 'Como Asesor, quiero crear una nueva OT seleccionando cliente, vehículo, registrando el problema reportado y el km de ingreso.',
    epicId: 'E2',
    priority: 'Alta',
    points: 8,
    status: 'in_progress',
    sprint: 'Sprint 1',
    acceptanceCriteria: [
      'Solo el rol "Asesor" puede crear OTs',
      'Número OT se genera automáticamente (OT-YYYY-XXXX)',
      'Estado inicial es siempre "registrada"',
    ],
  },
  {
    id: 's012',
    code: 'US-012',
    title: 'Asignar mecánico a OT',
    description: 'Como Jefe de Taller, quiero asignar un mecánico a una OT no asignada para distribuir el trabajo equitativamente.',
    epicId: 'E2',
    priority: 'Alta',
    points: 3,
    status: 'done',
    sprint: 'Sprint 1',
    acceptanceCriteria: [
      'Solo el Jefe puede asignar mecánicos',
      'Selector muestra mecánicos activos con carga actual',
      'Mecánico recibe notificación inmediata',
    ],
  },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  Alta: 'bg-red-100 text-red-700 border-red-300',
  Media: 'bg-amber-100 text-amber-700 border-amber-300',
  Baja: 'bg-slate-100 text-slate-600 border-slate-300',
};

const STATUS_CONFIG = {
  backlog: {
    label: 'Backlog',
    icon: <ListTodo size={18} />,
    color: 'bg-slate-50 border-slate-300',
  },
  todo: {
    label: 'To Do',
    icon: <Circle size={18} />,
    color: 'bg-blue-50 border-blue-300',
  },
  in_progress: {
    label: 'In Progress',
    icon: <PlayCircle size={18} />,
    color: 'bg-amber-50 border-amber-300',
  },
  done: {
    label: 'Done',
    icon: <CheckSquare size={18} />,
    color: 'bg-emerald-50 border-emerald-300',
  },
};

// ─── DRAG & DROP COMPONENTS ───────────────────────────────────────────────────
const DraggableStoryCard: React.FC<{
  story: UserStory;
  onEdit: (story: UserStory) => void;
  onDelete: (id: string) => void;
}> = ({ story, onEdit, onDelete }) => {
  const epic = EPICS.find((e) => e.id === story.epicId);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'story',
    item: { id: story.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white border border-slate-200 rounded-lg p-3 mb-2 cursor-move hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical size={14} className="text-slate-400" />
          <span className="text-xs font-mono text-slate-500">{story.code}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(story)}>
            <Edit2 size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(story.id)}>
            <Trash2 size={12} className="text-red-600" />
          </Button>
        </div>
      </div>

      <h4 className="text-sm mb-2">{story.title}</h4>

      <div className="flex flex-wrap gap-1 mb-2">
        {epic && (
          <Badge variant="outline" className={`text-xs ${epic.bgColor} ${epic.color} border`}>
            {epic.icon}
            <span className="ml-1">{epic.code}</span>
          </Badge>
        )}
        <Badge variant="outline" className={`text-xs border ${PRIORITY_COLORS[story.priority]}`}>
          {story.priority}
        </Badge>
        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-300">
          {story.points} pts
        </Badge>
      </div>

      {story.sprint && (
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Sparkles size={10} />
          {story.sprint}
        </div>
      )}
    </div>
  );
};

const KanbanColumn: React.FC<{
  status: Status;
  stories: UserStory[];
  onDrop: (storyId: string, newStatus: Status) => void;
  onEdit: (story: UserStory) => void;
  onDelete: (id: string) => void;
}> = ({ status, stories, onDrop, onEdit, onDelete }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'story',
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const config = STATUS_CONFIG[status];

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-[280px] ${config.color} border rounded-lg p-4 ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {config.icon}
          <h3 className="font-medium">{config.label}</h3>
          <Badge variant="outline" className="text-xs">
            {stories.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {stories.map((story) => (
          <DraggableStoryCard key={story.id} story={story} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

// ─── STORY FORM DIALOG ────────────────────────────────────────────────────────
const StoryFormDialog: React.FC<{
  story?: UserStory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (story: UserStory) => void;
}> = ({ story, open, onOpenChange, onSave }) => {
  const [formData, setFormData] = useState<Partial<UserStory>>(
    story || {
      title: '',
      description: '',
      epicId: 'E1',
      priority: 'Media',
      points: 3,
      status: 'backlog',
      acceptanceCriteria: [],
    }
  );

  const handleSave = () => {
    const newStory: UserStory = {
      id: story?.id || `s${Date.now()}`,
      code: story?.code || `US-${Math.floor(Math.random() * 1000)}`,
      title: formData.title || '',
      description: formData.description || '',
      epicId: (formData.epicId as EpicId) || 'E1',
      priority: (formData.priority as Priority) || 'Media',
      points: formData.points || 3,
      status: (formData.status as Status) || 'backlog',
      acceptanceCriteria: formData.acceptanceCriteria || [],
      sprint: formData.sprint,
    };

    onSave(newStory);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{story ? 'Editar Historia' : 'Nueva Historia de Usuario'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm mb-1 block">Título</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Registrar nuevo cliente"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Descripción</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Como [rol], quiero [funcionalidad] para [beneficio]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Épica</label>
              <Select value={formData.epicId} onValueChange={(value) => setFormData({ ...formData, epicId: value as EpicId })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EPICS.map((epic) => (
                    <SelectItem key={epic.id} value={epic.id}>
                      {epic.code} - {epic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm mb-1 block">Prioridad</label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm mb-1 block">Puntos de Historia</label>
              <Select
                value={formData.points?.toString()}
                onValueChange={(value) => setFormData({ ...formData, points: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 8, 13].map((p) => (
                    <SelectItem key={p} value={p.toString()}>
                      {p} puntos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm mb-1 block">Estado</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm mb-1 block">Sprint (opcional)</label>
            <Input
              value={formData.sprint || ''}
              onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
              placeholder="Ej: Sprint 1"
            />
          </div>

          <Button onClick={handleSave} className="w-full bg-slate-700 hover:bg-slate-800">
            {story ? 'Guardar Cambios' : 'Crear Historia'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UserStoryBoard() {
  const [stories, setStories] = useState<UserStory[]>(INITIAL_STORIES);
  const [editingStory, setEditingStory] = useState<UserStory | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Set<EpicId>>(new Set(['E1', 'E2']));

  const handleDrop = (storyId: string, newStatus: Status) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, status: newStatus } : s))
    );
  };

  const handleSave = (story: UserStory) => {
    setStories((prev) => {
      const exists = prev.find((s) => s.id === story.id);
      if (exists) {
        return prev.map((s) => (s.id === story.id ? story : s));
      }
      return [...prev, story];
    });
    setEditingStory(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta historia de usuario?')) {
      setStories((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleEdit = (story: UserStory) => {
    setEditingStory(story);
    setIsDialogOpen(true);
  };

  const toggleEpic = (epicId: EpicId) => {
    setExpandedEpics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  };

  const getStoriesByStatus = (status: Status) =>
    stories.filter((s) => s.status === status);

  const getStoriesByEpic = (epicId: EpicId) =>
    stories.filter((s) => s.epicId === epicId);

  const stats = {
    total: stories.length,
    backlog: stories.filter((s) => s.status === 'backlog').length,
    inProgress: stories.filter((s) => s.status === 'in_progress').length,
    done: stories.filter((s) => s.status === 'done').length,
    totalPoints: stories.reduce((sum, s) => sum + s.points, 0),
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-slate-800">TallerPro - Gestión de Historias de Usuario</h1>
            <Button
              onClick={() => {
                setEditingStory(undefined);
                setIsDialogOpen(true);
              }}
              className="bg-slate-700 hover:bg-slate-800"
            >
              <Plus size={16} className="mr-2" />
              Nueva Historia
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Total:</span>
              <Badge className="bg-slate-600">{stats.total}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Backlog:</span>
              <Badge className="bg-slate-400">{stats.backlog}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">En Progreso:</span>
              <Badge className="bg-amber-500">{stats.inProgress}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Completadas:</span>
              <Badge className="bg-emerald-600">{stats.done}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Total Puntos:</span>
              <Badge className="bg-blue-600">{stats.totalPoints}</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban">Tablero Kanban</TabsTrigger>
            <TabsTrigger value="epics">Por Épicas</TabsTrigger>
            <TabsTrigger value="list">Lista Completa</TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {(['backlog', 'todo', 'in_progress', 'done'] as Status[]).map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  stories={getStoriesByStatus(status)}
                  onDrop={handleDrop}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </TabsContent>

          {/* Epics View */}
          <TabsContent value="epics">
            <div className="space-y-4">
              {EPICS.map((epic) => {
                const epicStories = getStoriesByEpic(epic.id);
                const isExpanded = expandedEpics.has(epic.id);

                return (
                  <div key={epic.id} className={`border rounded-lg ${epic.bgColor}`}>
                    <button
                      onClick={() => toggleEpic(epic.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <div className={epic.color}>{epic.icon}</div>
                        <div className="text-left">
                          <h3 className="font-medium">{epic.code}</h3>
                          <p className="text-sm text-slate-600">{epic.title}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {epicStories.length} historias
                      </Badge>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-2">
                        {epicStories.map((story) => (
                          <div key={story.id} className="bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-500">{story.code}</span>
                                <Badge variant="outline" className={`text-xs border ${PRIORITY_COLORS[story.priority]}`}>
                                  {story.priority}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[story.status].color}`}>
                                  {STATUS_CONFIG[story.status].label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(story)}>
                                  <Edit2 size={12} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(story.id)}>
                                  <Trash2 size={12} className="text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <h4 className="text-sm mb-1">{story.title}</h4>
                            <p className="text-xs text-slate-600">{story.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <div className="bg-white border border-slate-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 text-sm">Código</th>
                    <th className="text-left p-3 text-sm">Título</th>
                    <th className="text-left p-3 text-sm">Épica</th>
                    <th className="text-left p-3 text-sm">Prioridad</th>
                    <th className="text-left p-3 text-sm">Estado</th>
                    <th className="text-left p-3 text-sm">Puntos</th>
                    <th className="text-left p-3 text-sm">Sprint</th>
                    <th className="text-right p-3 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => {
                    const epic = EPICS.find((e) => e.id === story.epicId);
                    return (
                      <tr key={story.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-xs font-mono">{story.code}</td>
                        <td className="p-3 text-sm">{story.title}</td>
                        <td className="p-3">
                          {epic && (
                            <Badge variant="outline" className={`text-xs ${epic.bgColor} ${epic.color}`}>
                              {epic.code}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs border ${PRIORITY_COLORS[story.priority]}`}>
                            {story.priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[story.status].color}`}>
                            {STATUS_CONFIG[story.status].label}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{story.points}</td>
                        <td className="p-3 text-xs text-slate-600">{story.sprint || '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(story)}>
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(story.id)}>
                              <Trash2 size={14} className="text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Story Form Dialog */}
        <StoryFormDialog
          story={editingStory}
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingStory(undefined);
          }}
          onSave={handleSave}
        />
      </div>
    </DndProvider>
  );
}
