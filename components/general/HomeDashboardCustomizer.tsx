'use client'

import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MeasuringStrategy,
    PointerSensor,
    useSensor,
    useSensors,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    type SortingStrategy,
} from '@dnd-kit/sortable'
import { CheckIcon, GripVerticalIcon, PlusIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { HOME_DASHBOARD_MODULE_COMPONENTS } from '@/components/general/HomeDashboardModuleMap'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    DASHBOARD_MODULE_IDS,
    DASHBOARD_MODULES,
    DEFAULT_DASHBOARD_MODULES,
    visibleDashboardModules,
    type DashboardModuleId,
} from '@/lib/dashboardModules'
import { cn } from '@/lib/utils'
import { useDashboardCustomizationStore } from '@/store/dashboardCustomization'
import { useOpenWebDashboardModules, useOpenWebSettingsStore } from '@/store/openWebSettings'

/**
 * Transform-based sorting previews stretch tiles when half- and full-width modules trade places,
 * so the preview comes from actually reordering the draft on drag-over instead: the grid reflows
 * for real and the dimmed tile marks exactly where the module will land.
 */
const reflowInPlaceStrategy: SortingStrategy = () => null

/**
 * The editable version of the home dashboard: every module renders as its real widget inside a
 * framed tile, laid out exactly like the saved dashboard, so dragging shows precisely where a
 * module will land and how it will look. Changes live in a local draft until saved into the
 * synced settings.
 */
export function HomeDashboardCustomizer({ administrator }: { administrator: boolean }) {
    const savedModules = useOpenWebDashboardModules()
    const setDashboardModules = useOpenWebSettingsStore((state) => state.setDashboardModules)
    const stopEditing = useDashboardCustomizationStore((state) => state.stopEditing)
    const [draft, setDraft] = useState<DashboardModuleId[]>(() =>
        visibleDashboardModules(savedModules, administrator),
    )
    const [activeId, setActiveId] = useState<DashboardModuleId | null>(null)
    // Order as it was when the drag started, restored if the drag is cancelled (Escape).
    const dragStartOrderRef = useRef<DashboardModuleId[] | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const catalog = visibleDashboardModules(DASHBOARD_MODULE_IDS, administrator)
    const hiddenModules = catalog.filter((id) => !draft.includes(id))

    function handleDragStart(event: DragStartEvent) {
        dragStartOrderRef.current = draft
        setActiveId(event.active.id as DashboardModuleId)
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) {
            return
        }

        setDraft((prev) => {
            const from = prev.indexOf(active.id as DashboardModuleId)
            const to = prev.indexOf(over.id as DashboardModuleId)
            if (from === -1 || to === -1 || from === to) {
                return prev
            }

            return arrayMove(prev, from, to)
        })
    }

    // The draft already holds the final order from the last drag-over reflow. Reordering again on
    // drop — against the reflowed layout — is what used to land modules one slot off the preview.
    function handleDragEnd() {
        dragStartOrderRef.current = null
        setActiveId(null)
    }

    function handleDragCancel() {
        if (dragStartOrderRef.current) {
            setDraft(dragStartOrderRef.current)
            dragStartOrderRef.current = null
        }
        setActiveId(null)
    }

    function handleSave() {
        // Non-admins never see the admin module, so keep it in their saved layout if it was there.
        const modules =
            !administrator && savedModules.includes('admin') ? (['admin', ...draft] as DashboardModuleId[]) : draft
        setDashboardModules(modules)
        stopEditing()
        toast.success('Dashboard layout saved')
    }

    return (
        <div className="flex flex-col gap-4 pb-12">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="min-w-0">
                    <h2 className="font-heading text-sm font-semibold text-foreground">Customize dashboard</h2>
                    <p className="text-xs text-muted-foreground">
                        Drag modules to reorder them, remove what you do not need, and add modules back below.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDraft(visibleDashboardModules(DEFAULT_DASHBOARD_MODULES, administrator))}
                    >
                        <RotateCcwIcon className="size-3.5" aria-hidden />
                        Reset layout
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={stopEditing}>
                        <XIcon className="size-3.5" aria-hidden />
                        Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleSave}>
                        <CheckIcon className="size-3.5" aria-hidden />
                        Save
                    </Button>
                </div>
            </div>

            {hiddenModules.length > 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">Add modules</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <TooltipProvider>
                            {hiddenModules.map((id) => {
                                const ModuleIcon = DASHBOARD_MODULES[id].icon
                                return (
                                    <Tooltip key={id}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDraft((prev) => [...prev, id])}
                                            >
                                                <PlusIcon className="size-3.5" aria-hidden />
                                                <ModuleIcon className="size-3.5" aria-hidden />
                                                {DASHBOARD_MODULES[id].title}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            {DASHBOARD_MODULES[id].description}
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </TooltipProvider>
                    </div>
                </div>
            ) : null}

            {draft.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                    Your dashboard is empty. Add modules from the list above.
                </div>
            ) : null}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext items={draft} strategy={reflowInPlaceStrategy}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {draft.map((id) => (
                            <SortableModuleTile
                                key={id}
                                id={id}
                                onRemove={() => setDraft((prev) => prev.filter((moduleId) => moduleId !== id))}
                            />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>{activeId ? <ModuleDragGhost id={activeId} /> : null}</DragOverlay>
            </DndContext>
        </div>
    )
}

function SortableModuleTile({ id, onRemove }: { id: DashboardModuleId; onRemove: () => void }) {
    const def = DASHBOARD_MODULES[id]
    const ModuleIcon = def.icon
    const ModuleComponent = HOME_DASHBOARD_MODULE_COMPONENTS[id]
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({ id })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex flex-col overflow-hidden rounded-xl border border-dashed border-muted-foreground/40 bg-card',
                def.size === 'full' && 'sm:col-span-2',
                isDragging && 'opacity-40',
            )}
        >
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-muted/40 px-2 py-1.5">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                ref={setActivatorNodeRef}
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                                aria-label={`Move ${def.title}`}
                                {...attributes}
                                {...listeners}
                            >
                                <GripVerticalIcon className="size-4" aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Drag to move</TooltipContent>
                    </Tooltip>
                    <ModuleIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
                        {def.title}
                    </span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 text-muted-foreground"
                                aria-label={`Remove ${def.title} from the dashboard`}
                                onClick={onRemove}
                            >
                                <XIcon className="size-4" aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove from dashboard</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* Previews are decorative here: not interactive, hidden from assistive tech. */}
            <div className="pointer-events-none min-h-0 flex-1 select-none p-2 opacity-80" aria-hidden>
                <ModuleComponent />
            </div>
        </div>
    )
}

/** What follows the pointer while dragging; the tile itself stays in the grid as a dimmed slot. */
function ModuleDragGhost({ id }: { id: DashboardModuleId }) {
    const def = DASHBOARD_MODULES[id]
    const ModuleIcon = def.icon

    return (
        <div className="flex h-full items-center gap-2 rounded-xl border border-muted-foreground/50 bg-card px-4 shadow-lg">
            <ModuleIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate text-sm font-medium text-foreground">{def.title}</span>
        </div>
    )
}
