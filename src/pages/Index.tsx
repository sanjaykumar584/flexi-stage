import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSections,
  fetchComponentsBySection,
  type ComponentItem,
  type Section,
} from "@/lib/mockApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

// Draggable row wrapper used for both components and series items
function DraggableRow({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (opts: {
    handleProps: any;
    isDragging: boolean;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({ handleProps: { ...attributes, ...listeners }, isDragging })}
    </div>
  );
}

const Index = () => {
  // SEO basics per page
  useEffect(() => {
    document.title = "Creative Sections – Singing & Acting";
    const metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc) metaDesc.setAttribute("content", "Browse singing and acting sections. Reorder components and series with drag-and-drop.");
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) ogTitle.setAttribute("content", "Creative Sections – Singing & Acting");
  }, []);

  const { data: sections, isLoading: loadingSections } = useQuery<Section[]>({
    queryKey: ["sections"],
    queryFn: fetchSections,
  });

  const [selectedSection, setSelectedSection] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedSection && sections && sections.length > 0) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, selectedSection]);

  const {
    data: fetchedComponents,
    isLoading: loadingComponents,
  } = useQuery<ComponentItem[]>({
    queryKey: ["components", selectedSection],
    queryFn: () => fetchComponentsBySection(selectedSection as string),
    enabled: !!selectedSection,
  });

  const [components, setComponents] = useState<ComponentItem[]>([]);

  useEffect(() => {
    if (fetchedComponents) setComponents(fetchedComponents);
  }, [fetchedComponents]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onComponentsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = components.findIndex((c) => c.id === active.id);
    const newIndex = components.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setComponents((prev) => arrayMove(prev, oldIndex, newIndex));
    toast.success("Components order updated");
  };

  const onSeriesDragEnd = (componentId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setComponents((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => c.id === componentId);
      if (idx < 0) return prev;
      const series = next[idx].series;
      const oldIndex = series.findIndex((s) => s.id === active.id);
      const newIndex = series.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      next[idx] = { ...next[idx], series: arrayMove(series, oldIndex, newIndex) };
      return next;
    });
    toast("Series order updated");
  };

  const currentSectionLabel = useMemo(() => {
    return sections?.find((s) => s.id === selectedSection)?.name ?? "";
  }, [sections, selectedSection]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Creative Sections: Singing & Acting</h1>
              <p className="text-muted-foreground">
                Choose a section and manage the order of components and their series.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <label className="text-sm text-muted-foreground mb-2 block">Select section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingSections ? "Loading sections..." : "Pick a section"} />
                </SelectTrigger>
                <SelectContent>
                  {sections?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <section aria-labelledby="components-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="components-heading" className="text-xl font-semibold">
              Components {currentSectionLabel ? `in ${currentSectionLabel}` : ""}
            </h2>
            <span className="text-sm text-muted-foreground">Drag the grip to reorder</span>
          </div>

          {loadingComponents ? (
            <div className="text-muted-foreground">Loading components...</div>
          ) : components.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No components found.
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onComponentsDragEnd}>
              <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {components.map((comp) => (
                    <DraggableRow key={comp.id} id={comp.id}>
                      {({ handleProps }) => (
                        <Card>
                          <CardHeader className="py-3">
                            <div className="flex items-center gap-3">
                              <button
                                aria-label="Drag to reorder component"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                {...handleProps}
                              >
                                <GripVertical className="h-5 w-5" />
                              </button>
                              <CardTitle className="text-base">{comp.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Accordion type="multiple" className="w-full">
                              <AccordionItem value={`${comp.id}-series`}>
                                <AccordionTrigger>Series inside {comp.name}</AccordionTrigger>
                                <AccordionContent>
                                  {comp.series.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No series.</div>
                                  ) : (
                                    <DndContext
                                      sensors={sensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={onSeriesDragEnd(comp.id)}
                                    >
                                      <SortableContext
                                        items={comp.series.map((s) => s.id)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        <ul className="space-y-2">
                                          {comp.series.map((s) => (
                                            <DraggableRow key={s.id} id={s.id}>
                                              {({ handleProps }) => (
                                                <li className="flex items-center justify-between rounded-md border bg-card text-card-foreground px-3 py-2">
                                                  <div className="flex items-center gap-3">
                                                    <button
                                                      aria-label="Drag to reorder series"
                                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                                      {...handleProps}
                                                    >
                                                      <GripVertical className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-sm font-medium">{s.title}</span>
                                                  </div>
                                                </li>
                                              )}
                                            </DraggableRow>
                                          ))}
                                        </ul>
                                      </SortableContext>
                                    </DndContext>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </CardContent>
                        </Card>
                      )}
                    </DraggableRow>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
