import React, { useState } from 'react';
import {
  Target, GitBranch, Database, Code2, CheckCircle2, Clock,
  ChevronRight, ChevronDown, Star, Layers, CalendarDays,
  Users, Car, Wrench, Receipt, AlertCircle, BookOpen,
  Circle, Diamond, Square, ArrowDown, Minus, Box, Triangle,
  TrendingUp, Package, BarChart2, Settings2,
} from 'lucide-react';
import { EPICS, EpicData, Sprint, FlowNode, UMLClass, Relation, DBTable, EpicColor } from '../data/planningData';

// ─── Color maps ────────────────────────────────────────────────────────────────

const EPIC_COLORS: Record<EpicColor, {
  bg: string; light: string; border: string; text: string; badge: string;
  ring: string; accent: string; gradient: string; dot: string;
}> = {
  blue:    { bg: 'bg-blue-600',    light: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-800',    ring: 'ring-blue-300',    accent: '#3B82F6', gradient: 'from-blue-600 to-blue-700',    dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', ring: 'ring-emerald-300', accent: '#10B981', gradient: 'from-emerald-600 to-emerald-700', dot: 'bg-emerald-500' },
  orange:  { bg: 'bg-orange-500',  light: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-800',  ring: 'ring-orange-300',  accent: '#F97316', gradient: 'from-orange-500 to-orange-600',  dot: 'bg-orange-500' },
  purple:  { bg: 'bg-purple-600',  light: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  badge: 'bg-purple-100 text-purple-800',  ring: 'ring-purple-300',  accent: '#8B5CF6', gradient: 'from-purple-600 to-purple-700',  dot: 'bg-purple-500' },
};

const TASK_TYPE_STYLE: Record<string, string> = {
  BD:      'bg-violet-100 text-violet-700 border-violet-200',
  Backend: 'bg-blue-100  text-blue-700  border-blue-200',
  Frontend:'bg-cyan-100  text-cyan-700  border-cyan-200',
  UX:      'bg-pink-100  text-pink-700  border-pink-200',
  Tests:   'bg-amber-100 text-amber-700 border-amber-200',
  DevOps:  'bg-slate-100 text-slate-700 border-slate-200',
  APIs:    'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const PRIORITY_STYLE: Record<string, string> = {
  Alta:  'bg-red-100 text-red-700',
  Media: 'bg-amber-100 text-amber-700',
  Baja:  'bg-slate-100 text-slate-500',
};

const RELATION_SYMBOLS: Record<string, { sym: string; color: string; desc: string }> = {
  composition:  { sym: '◆', color: 'text-slate-800', desc: 'Composición (rombo negro)' },
  association:  { sym: '→',  color: 'text-blue-600',  desc: 'Asociación dirigida' },
  aggregation:  { sym: '◇', color: 'text-slate-500', desc: 'Agregación (rombo vacío)' },
  dependency:   { sym: '⟶', color: 'text-purple-600', desc: 'Dependencia' },
};

const CLASS_COLOR: Record<EpicColor, { header: string; border: string; attrBg: string; methodBg: string }> = {
  blue:    { header: 'bg-blue-600 text-white',   border: 'border-blue-300',   attrBg: 'bg-blue-50',    methodBg: 'bg-blue-100/60' },
  emerald: { header: 'bg-emerald-600 text-white', border: 'border-emerald-300', attrBg: 'bg-emerald-50', methodBg: 'bg-emerald-100/60' },
  orange:  { header: 'bg-orange-500 text-white',  border: 'border-orange-300',  attrBg: 'bg-orange-50',  methodBg: 'bg-orange-100/60' },
  purple:  { header: 'bg-purple-600 text-white',  border: 'border-purple-300',  attrBg: 'bg-purple-50',  methodBg: 'bg-purple-100/60' },
};

const EPIC_ICONS: Record<string, React.ReactNode> = {
  E1: <Users size={20} />,
  E2: <CalendarDays size={20} />,
  E3: <Wrench size={20} />,
  E4: <Receipt size={20} />,
};

// ─── SprintsBoard ─────────────────────────────────────────────────────────────

function SprintsBoard({ epic }: { epic: EpicData }) {
  const [openSprint, setOpenSprint] = useState<number>(0);
  const c = EPIC_COLORS[epic.colorKey];

  const totalPoints = epic.sprints.reduce((acc, s) => acc + s.tasks.reduce((a, t) => a + t.points, 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Sprints', value: epic.sprints.length, icon: <GitBranch size={14} /> },
          { label: 'Tareas', value: epic.sprints.reduce((a, s) => a + s.tasks.length, 0), icon: <CheckCircle2 size={14} /> },
          { label: 'Story Points', value: totalPoints, icon: <Star size={14} /> },
          { label: 'Semanas', value: 6, icon: <Clock size={14} /> },
        ].map(m => (
          <div key={m.label} className={`${c.light} ${c.border} border rounded-xl px-4 py-3 flex items-center gap-3`}>
            <div className={`${c.bg} text-white rounded-lg p-1.5 flex-shrink-0`}>{m.icon}</div>
            <div>
              <p className="text-xl font-bold text-slate-800">{m.value}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sprint cards */}
      {epic.sprints.map((sprint, idx) => {
        const pts = sprint.tasks.reduce((a, t) => a + t.points, 0);
        const isOpen = openSprint === idx;
        return (
          <div key={sprint.n} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Sprint header */}
            <button
              onClick={() => setOpenSprint(isOpen ? -1 : idx)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className={`${c.bg} text-white rounded-xl w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                S{sprint.n}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-800 text-sm">{sprint.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{sprint.weeks}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{sprint.goal}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-700">{pts} pts</p>
                  <p className="text-xs text-slate-400">{sprint.tasks.length} tareas</p>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </div>
            </button>

            {/* Tasks */}
            {isOpen && (
              <div className="border-t border-slate-100">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                  {sprint.tasks.map(task => (
                    <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{task.code}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
                          <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${TASK_TYPE_STYLE[task.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{task.type}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug mb-1.5">{task.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{task.desc}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400">Story Points</span>
                        <span className={`text-sm font-bold ${c.text}`}>{task.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── FlowDiagram ─────────────────────────────────────────────────────────────

function FlowDiagram({ epic }: { epic: EpicData }) {
  const c = EPIC_COLORS[epic.colorKey];

  const nodeStyle = (type: FlowNode['type']) => {
    switch (type) {
      case 'start':     return `${c.bg} text-white rounded-full px-6 py-2 shadow-md`;
      case 'end':       return 'bg-slate-700 text-white rounded-full px-6 py-2 shadow-md';
      case 'decision':  return 'bg-amber-50 border-2 border-amber-400 text-amber-800 rounded-xl px-4 py-2.5';
      case 'subprocess':return `${c.light} border-2 ${c.border} ${c.text} rounded-xl px-4 py-2.5`;
      case 'io':        return 'bg-slate-100 border-2 border-slate-300 text-slate-700 rounded-lg px-4 py-2 italic';
      default:          return 'bg-white border-2 border-slate-300 text-slate-700 rounded-xl px-4 py-2.5 shadow-sm';
    }
  };

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'Inicio / Fin', cls: `${c.bg} text-white rounded-full px-3 py-1 text-xs font-medium` },
          { label: 'Proceso', cls: 'bg-white border-2 border-slate-300 text-slate-700 rounded-xl px-3 py-1 text-xs font-medium shadow-sm' },
          { label: 'Subproceso', cls: `${c.light} border-2 ${c.border} ${c.text} rounded-xl px-3 py-1 text-xs font-medium` },
          { label: 'Decisión', cls: 'bg-amber-50 border-2 border-amber-400 text-amber-800 rounded-xl px-3 py-1 text-xs font-medium' },
          { label: 'E/S Datos', cls: 'bg-slate-100 border-2 border-slate-300 text-slate-600 rounded-lg px-3 py-1 text-xs font-medium italic' },
        ].map(item => (
          <span key={item.label} className={item.cls}>{item.label}</span>
        ))}
      </div>

      {/* Flow nodes */}
      <div className="flex flex-col items-center gap-0 max-w-2xl mx-auto">
        {epic.flowNodes.map((node, i) => (
          <React.Fragment key={i}>
            {/* Arrow */}
            {i > 0 && (
              <div className="flex flex-col items-center gap-0 my-1">
                <div className="w-0.5 h-4 bg-slate-300" />
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-slate-300" />
              </div>
            )}

            {/* Node */}
            <div className="w-full flex flex-col items-center">
              {node.type === 'decision' ? (
                <div className="w-full max-w-md">
                  {/* Decision diamond-ish */}
                  <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-800 text-center justify-center">
                    <span className="text-amber-500 text-base">◇</span>
                    <span>{node.label}</span>
                    <span className="text-amber-500 text-base">◇</span>
                  </div>
                  {/* Branches */}
                  {node.branches && (
                    <div className="flex gap-3 mt-2 w-full">
                      <div className="flex-1 border border-emerald-300 bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700">
                        <p className="font-bold text-emerald-600 mb-0.5">✓ Sí:</p>
                        <p>{node.branches.yes}</p>
                      </div>
                      <div className="flex-1 border border-red-200 bg-red-50 rounded-xl px-3 py-2 text-xs text-red-700">
                        <p className="font-bold text-red-500 mb-0.5">✗ No:</p>
                        <p>{node.branches.no}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`w-full max-w-md text-center text-sm font-medium shadow-sm ${nodeStyle(node.type)}`}>
                  <p>{node.label}</p>
                  {node.note && <p className="text-xs mt-0.5 opacity-75 font-normal">{node.note}</p>}
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── ClassDiagram ─────────────────────────────────────────────────────────────

function ClassDiagram({ epic }: { epic: EpicData }) {
  const c = EPIC_COLORS[epic.colorKey];
  const cc = CLASS_COLOR[epic.colorKey];

  return (
    <div className="space-y-6">
      {/* Class boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {epic.classes.map(cls => (
          <div key={cls.name} className={`rounded-xl border-2 ${cc.border} overflow-hidden shadow-sm font-mono text-xs`}>
            {/* Header */}
            <div className={`${cc.header} px-3 py-2 text-center`}>
              {cls.stereotype && <p className="text-xs opacity-75 mb-0.5">«{cls.stereotype}»</p>}
              <p className="font-bold text-sm">{cls.name}</p>
            </div>
            {/* Attributes */}
            <div className={`${cc.attrBg} border-b border-opacity-30 ${cc.border}`}>
              <div className="px-3 py-1.5 space-y-0.5">
                {cls.attrs.map((attr, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-700">
                    <span className={`flex-shrink-0 font-bold ${attr.vis === '+' ? 'text-emerald-600' : attr.vis === '-' ? 'text-red-500' : 'text-amber-600'}`}>{attr.vis}</span>
                    <span className="text-blue-600">{attr.type}</span>
                    <span className="font-medium text-slate-800">{attr.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Methods */}
            <div className={`${cc.methodBg} px-3 py-1.5 space-y-0.5`}>
              {cls.methods.map((m, i) => (
                <div key={i} className="flex items-start gap-1.5 text-slate-700">
                  <span className={`flex-shrink-0 font-bold ${m.vis === '+' ? 'text-emerald-600' : 'text-red-500'}`}>{m.vis}</span>
                  <span className="text-purple-600">{m.ret}</span>
                  <span className="font-medium text-slate-800">{m.name}</span>
                  <span className="text-slate-400">({m.params})</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Relations */}
      <div className={`${c.light} ${c.border} border rounded-2xl p-4`}>
        <h3 className={`text-sm font-bold ${c.text} mb-3 flex items-center gap-2`}>
          <GitBranch size={14} /> Relaciones entre Clases
        </h3>
        <div className="space-y-2">
          {epic.relations.map((rel, i) => {
            const sym = RELATION_SYMBOLS[rel.type];
            return (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-slate-100 text-sm">
                <span className="font-bold text-slate-700 font-mono">{rel.from}</span>
                <span className="text-slate-400 text-xs">[{rel.fromMult}]</span>
                <span className={`font-bold text-lg ${sym.color}`}>{sym.sym}</span>
                <span className="text-slate-400 text-xs">[{rel.toMult}]</span>
                <span className="font-bold text-slate-700 font-mono">{rel.to}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{rel.label}</span>
                <span className="text-xs text-slate-400 hidden sm:block">{sym.desc}</span>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-200">
          {Object.entries(RELATION_SYMBOLS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`font-bold text-base ${val.color}`}>{val.sym}</span>
              <span>{val.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DBDesign ─────────────────────────────────────────────────────────────────

function DBDesign({ epic }: { epic: EpicData }) {
  const c = EPIC_COLORS[epic.colorKey];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {epic.tables.map(table => (
        <div key={table.name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className={`${c.bg} text-white px-4 py-2.5 flex items-center gap-2`}>
            <Database size={14} />
            <span className="font-bold text-sm font-mono">{table.name}</span>
          </div>
          {/* Columns */}
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Columna</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Tipo</th>
                <th className="text-center px-2 py-1.5 font-semibold text-slate-600">Llaves</th>
                <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.columns.map((col, i) => (
                <tr key={i} className={`hover:bg-slate-50 ${col.pk ? 'bg-yellow-50' : ''}`}>
                  <td className="px-3 py-1.5 font-mono font-semibold text-slate-800">{col.name}</td>
                  <td className="px-3 py-1.5 font-mono text-blue-700">{col.type}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {col.pk && <span className="bg-yellow-400 text-yellow-900 px-1 rounded font-bold">PK</span>}
                      {col.fk && <span className="bg-blue-200 text-blue-800 px-1 rounded font-bold">FK</span>}
                      {col.unique && <span className="bg-purple-100 text-purple-700 px-1 rounded font-bold">UQ</span>}
                      {col.notnull && <span className="bg-red-100 text-red-700 px-1 rounded font-bold">NN</span>}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-500 italic">{col.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── EpicDetail ─────────────────────────────────────────────────────────────

type InnerTab = 'sprints' | 'flow' | 'classes' | 'db';

function EpicDetail({ epic }: { epic: EpicData }) {
  const [innerTab, setInnerTab] = useState<InnerTab>('sprints');
  const c = EPIC_COLORS[epic.colorKey];

  const innerTabs: { id: InnerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sprints', label: 'Sprints y Tareas', icon: <GitBranch size={14} /> },
    { id: 'flow',    label: 'Diagrama de Flujo', icon: <ArrowDown size={14} /> },
    { id: 'classes', label: 'Diagrama de Clases', icon: <Box size={14} /> },
    { id: 'db',      label: 'Diseño de BD', icon: <Database size={14} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Epic header */}
      <div className={`bg-gradient-to-r ${c.gradient} rounded-2xl p-5 text-white`}>
        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-xl p-3 flex-shrink-0 text-2xl">{epic.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-mono font-bold">{epic.code}</span>
              <span className="text-white/70 text-xs">{epic.subtitle}</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{epic.title}</h2>
            <p className="text-white/85 text-sm leading-relaxed">{epic.objective}</p>
          </div>
        </div>
        <div className="mt-4 bg-white/10 rounded-xl p-3 text-sm text-white/80 leading-relaxed border border-white/20">
          <span className="font-semibold text-white">¿Por qué esta épica? </span>
          {epic.rationale}
        </div>
      </div>

      {/* Inner tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {innerTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setInnerTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              innerTab === tab.id ? `bg-white shadow ${c.text} font-semibold` : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inner tab content */}
      <div className="min-h-[400px]">
        {innerTab === 'sprints' && <SprintsBoard epic={epic} />}
        {innerTab === 'flow'    && <FlowDiagram epic={epic} />}
        {innerTab === 'classes' && <ClassDiagram epic={epic} />}
        {innerTab === 'db'      && <DBDesign epic={epic} />}
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function Overview({ onSelectEpic }: { onSelectEpic: (idx: number) => void }) {
  const totalTasks = EPICS.reduce((acc, e) => acc + e.sprints.reduce((a, s) => a + s.tasks.length, 0), 0);
  const totalPoints = EPICS.reduce((acc, e) => acc + e.sprints.reduce((a, s) => a + s.tasks.reduce((p, t) => p + t.points, 0), 0), 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Épicas', value: 4, sub: '4 Objetivos Específicos', icon: <Target size={18} className="text-white"/>, bg: 'bg-blue-600' },
          { label: 'Sprints', value: 12, sub: '3 sprints por épica', icon: <GitBranch size={18} className="text-white"/>, bg: 'bg-emerald-600' },
          { label: 'Tareas', value: totalTasks, sub: 'Historias de usuario', icon: <CheckCircle2 size={18} className="text-white"/>, bg: 'bg-orange-500' },
          { label: 'Story Points', value: totalPoints, sub: 'Total planificado', icon: <Star size={18} className="text-white"/>, bg: 'bg-purple-600' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className={`${m.bg} rounded-xl p-2`}>{m.icon}</div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{m.value}</p>
            <p className="text-sm font-semibold text-slate-700">{m.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Epic cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EPICS.map((epic, idx) => {
          const c = EPIC_COLORS[epic.colorKey];
          const pts = epic.sprints.reduce((a, s) => a + s.tasks.reduce((p, t) => p + t.points, 0), 0);
          const tasks = epic.sprints.reduce((a, s) => a + s.tasks.length, 0);
          return (
            <button
              key={epic.id}
              onClick={() => onSelectEpic(idx + 1)}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`${c.bg} text-white rounded-xl p-3 text-2xl flex-shrink-0`}>{epic.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${c.badge}`}>{epic.code}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-slate-900">{epic.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">{epic.subtitle}</p>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{epic.objective}</p>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={12} className="text-slate-400"/>
                      <span className="text-xs text-slate-600">{epic.sprints.length} sprints</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-slate-400"/>
                      <span className="text-xs text-slate-600">{tasks} tareas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-slate-400"/>
                      <span className="text-xs text-slate-600">{pts} pts</span>
                    </div>
                    <ChevronRight size={14} className={`ml-auto ${c.text} opacity-0 group-hover:opacity-100 transition-opacity`}/>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Gantt-style timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart2 size={16}/> Cronograma de Sprints (24 semanas)</h3>
        <div className="space-y-3">
          {EPICS.map(epic => {
            const c = EPIC_COLORS[epic.colorKey];
            return (
              <div key={epic.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-48 flex-shrink-0">
                  <span className="text-lg">{epic.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-tight">{epic.code}</p>
                    <p className="text-xs text-slate-400 truncate">{epic.title.split(' ')[0]}...</p>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-12 gap-0.5">
                  {Array.from({ length: 12 }).map((_, si) => {
                    const epicIdx = EPICS.indexOf(epic);
                    const inRange = si >= epicIdx * 3 && si < epicIdx * 3 + 3;
                    return (
                      <div key={si} className={`h-6 rounded-sm flex items-center justify-center ${inRange ? `${c.bg} text-white text-xs font-bold` : 'bg-slate-100'}`}>
                        {inRange ? `S${si - epicIdx * 3 + 1}` : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="w-16 text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">Sem {EPICS.indexOf(epic) * 6 + 1}–{EPICS.indexOf(epic) * 6 + 6}</p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 mt-1">
            <div className="w-48" />
            <div className="flex-1 grid grid-cols-12 gap-0.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="text-xs text-slate-400 text-center">{i + 1}</div>
              ))}
            </div>
            <div className="w-16" />
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">Sprint #</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main EpicsPlanning ───────────────────────────────────────────────────────

export default function EpicsPlanning() {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3 | 4>(0);

  const tabs = [
    { id: 0 as const, label: 'Resumen', icon: <Layers size={15} /> },
    { id: 1 as const, label: 'Épica 1', icon: <span>👥</span>, sub: 'Clientes' },
    { id: 2 as const, label: 'Épica 2', icon: <span>📅</span>, sub: 'Citas' },
    { id: 3 as const, label: 'Épica 3', icon: <span>🔧</span>, sub: 'OT' },
    { id: 4 as const, label: 'Épica 4', icon: <span>💰</span>, sub: 'Facturación' },
  ];

  const activeEpic = activeTab > 0 ? EPICS[activeTab - 1] : null;
  const ac = activeEpic ? EPIC_COLORS[activeEpic.colorKey] : null;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={20} className="text-slate-600" />
            <h1 className="text-xl font-bold text-slate-800">Plan de Desarrollo — TallerPro DMS</h1>
          </div>
          <p className="text-sm text-slate-500">4 Épicas · 12 Sprints · 24 Semanas · Sprints de 2 semanas con metodología Scrum</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">v2.0 — Revisado</span>
        </div>
      </div>

      {/* Main tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const epic = tab.id > 0 ? EPICS[tab.id - 1] : null;
          const isActive = activeTab === tab.id;
          const tc = epic ? EPIC_COLORS[epic.colorKey] : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? tc ? `bg-white shadow ${tc.text} font-semibold` : 'bg-white shadow text-slate-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.sub && isActive && (
                <span className={`text-xs hidden sm:inline ${tc?.text} opacity-70`}>· {tab.sub}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <Overview onSelectEpic={(idx) => setActiveTab(idx as 1 | 2 | 3 | 4)} />}
      {activeTab > 0 && activeEpic && <EpicDetail epic={activeEpic} />}
    </div>
  );
}
