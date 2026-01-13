import React, { useState, useMemo } from 'react';
import { Download, RefreshCw, Utensils, GripVertical, AlertCircle, Check, X, Plus } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useIsMobile } from '../hooks/useIsMobile';
import type { Recipe, Tag, WeeklyPlan, DragItem, TagType } from '../types';

interface WeeklyPlannerProps {
  recipes: Recipe[];
  tags: Tag[];
  plan: WeeklyPlan | null;
  weekStartDate: string;
  onUpdateEntry: (date: string, recipeId: string, servings: number) => void;
  onDeleteEntry: (date: string) => void;
  onValidate: () => void;
  onExport: () => void;
  onWeekChange: (weekStartDate: string) => void;
}

const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getDaysForWeek = (monday: Date) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const formatMondayDate = (monday: Date) => formatDate(monday);

// Group tags by type
const TAG_TYPES: TagType[] = ['PROTEIN', 'PORTION', 'PREP', 'OTHER'];

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  recipes,
  tags,
  plan,
  weekStartDate,
  onUpdateEntry,
  onDeleteEntry,
  onValidate,
  onExport,
  onWeekChange,
}) => {
  const isMobile = useIsMobile();
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [tagSelection, setTagSelection] = useState<{
    isOpen: boolean;
    tagId: string | null;
    date: string | null;
  }>({ isOpen: false, tagId: null, date: null });
  const [servingsEdit, setServingsEdit] = useState<{ date: string; servings: number } | null>(null);
  const [mobileAddRecipe, setMobileAddRecipe] = useState<{
    isOpen: boolean;
    date: string | null;
    selectedTags: string[];
  }>({ isOpen: false, date: null, selectedTags: [] });

  const monday = useMemo(() => {
    const start = getMondayOfCurrentWeek();
    if (weekOffset === 1) start.setDate(start.getDate() + 7);
    return start;
  }, [weekOffset]);

  const weekDays = useMemo(() => getDaysForWeek(monday), [monday]);

  // Update parent when week changes
  React.useEffect(() => {
    const newWeekStart = formatMondayDate(monday);
    if (newWeekStart !== weekStartDate) {
      onWeekChange(newWeekStart);
    }
  }, [monday, weekStartDate, onWeekChange]);

  const getRecipe = (id: string) => recipes.find((r) => r.recipe_id === id);
  const getTag = (id: string) => tags.find((t) => t.tag_id === id);

  const tagRecipes = useMemo(() => {
    if (!tagSelection.tagId) return [];
    return recipes
      .filter((r) => r.tag_ids.includes(tagSelection.tagId!))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [recipes, tagSelection.tagId]);

  const handleDragStart = (
    e: React.DragEvent,
    type: 'RECIPE' | 'TAG',
    id: string,
    source?: { date: string }
  ) => {
    setDraggedItem({ type, id, source });
    e.dataTransfer.effectAllowed = source ? 'move' : 'copy';
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    if (dragOverCell !== cellId) setDragOverCell(cellId);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!draggedItem) return;

    if (draggedItem.type === 'RECIPE') {
      if (draggedItem.source) {
        // Moving from another cell - delete source first
        if (draggedItem.source.date !== targetDate) {
          onDeleteEntry(draggedItem.source.date);
        }
      }
      const recipe = getRecipe(draggedItem.id);
      if (recipe) {
        onUpdateEntry(targetDate, draggedItem.id, recipe.default_servings);
      }
    } else if (draggedItem.type === 'TAG') {
      setTagSelection({ isOpen: true, tagId: draggedItem.id, date: targetDate });
    }
    setDraggedItem(null);
  };

  const handleSelectRecipeFromTag = (recipeId: string) => {
    const { date } = tagSelection;
    if (date) {
      const recipe = getRecipe(recipeId);
      if (recipe) {
        onUpdateEntry(date, recipeId, recipe.default_servings);
      }
    }
    setTagSelection({ isOpen: false, tagId: null, date: null });
  };

  const handleServingsUpdate = () => {
    if (servingsEdit) {
      const entry = plan?.entries[servingsEdit.date];
      if (entry) {
        onUpdateEntry(servingsEdit.date, entry.recipe_id, servingsEdit.servings);
      }
      setServingsEdit(null);
    }
  };

  // Mobile handlers
  const handleMobileCellClick = (date: string) => {
    if (isMobile) {
      setMobileAddRecipe({ isOpen: true, date, selectedTags: [] });
    }
  };

  const handleMobileToggleTag = (tagId: string) => {
    setMobileAddRecipe((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter((id) => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  };

  const handleMobileSelectRecipe = (recipeId: string) => {
    const { date } = mobileAddRecipe;
    if (date) {
      const recipe = getRecipe(recipeId);
      if (recipe) {
        onUpdateEntry(date, recipeId, recipe.default_servings);
      }
    }
    setMobileAddRecipe({ isOpen: false, date: null, selectedTags: [] });
  };

  const mobileFilteredRecipes = useMemo(() => {
    if (mobileAddRecipe.selectedTags.length === 0) return recipes;
    return recipes.filter((r) =>
      mobileAddRecipe.selectedTags.some((tagId) => r.tag_ids.includes(tagId))
    );
  }, [recipes, mobileAddRecipe.selectedTags]);

  const entries = plan?.entries || {};

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-80px)] overflow-hidden bg-white font-sans text-slate-900">
      {/* SIDEBAR: PANTRY - Hidden on mobile */}
      {!isMobile && (
        <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 lg:h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold tracking-tight mb-1">Pantry</h2>
          <p className="text-xs text-slate-400">Drag items to plan your week.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Tags Section */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">
              Labels
            </h3>
            <div className="space-y-5">
              {TAG_TYPES.map((type) => {
                const typeTags = tags.filter((t) => t.type === type);
                if (typeTags.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="text-[10px] text-slate-300 font-bold mb-2 uppercase">{type}</div>
                    <div className="flex flex-wrap gap-2">
                      {typeTags.map((tag) => (
                        <div
                          key={tag.tag_id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'TAG', tag.tag_id)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-grab active:cursor-grabbing shadow-sm hover:scale-105 transition-transform"
                        >
                          {tag.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recipes Section */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">
              Your Recipes
            </h3>
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <div
                  key={recipe.recipe_id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'RECIPE', recipe.recipe_id)}
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-300 transition-all flex items-start gap-4 group"
                >
                  <GripVertical
                    className="text-slate-200 group-hover:text-slate-400 mt-1 transition-colors"
                    size={16}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm line-clamp-2 leading-snug" title={recipe.title}>{recipe.title}</div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {recipe.tag_ids.slice(0, 2).map((tid) => {
                        const t = getTag(tid);
                        return t ? (
                          <span
                            key={tid}
                            className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded-full uppercase border border-slate-100"
                          >
                            {t.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {recipes.length === 0 && (
                <div className="text-xs text-slate-300 italic text-center py-2">No recipes found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar */}
        <div className="px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  weekOffset === 0
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setWeekOffset(1)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  weekOffset === 1
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Next Week
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onValidate}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-900 rounded-xl text-sm font-bold hover:bg-amber-300 transition-colors shadow-sm"
            >
              <RefreshCw size={16} /> Confirm
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg"
            >
              <Download size={16} /> Export ICS
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto bg-slate-50/30 custom-scrollbar">
          <div className="p-8 min-w-[900px] w-full max-w-[1600px] mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              {/* Header: Days */}
              <div className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-slate-100">
                <div className="p-6 bg-slate-50/50 flex flex-col justify-end">
                  <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em]">
                    Dinner
                  </span>
                </div>
                {weekDays.map((d) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={d.toISOString()}
                      className={`p-6 text-center border-l border-slate-50 ${
                        isToday ? 'bg-slate-900 text-white shadow-inner' : ''
                      }`}
                    >
                      <div
                        className={`text-[11px] font-black uppercase tracking-widest ${
                          isToday ? 'text-slate-400' : 'text-slate-300'
                        }`}
                      >
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="mt-2 text-2xl font-black">{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Row: Dinner */}
              <div className="grid grid-cols-[120px_repeat(7,1fr)]">
                <div className="p-6 flex items-center justify-center bg-slate-50/50 border-r border-slate-50">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] vertical-text">
                    Dinner
                  </span>
                </div>

                {weekDays.map((d) => {
                  const dateStr = formatDate(d);
                  const cellId = dateStr;
                  const entry = entries[dateStr];
                  const plannedRecipe = entry ? getRecipe(entry.recipe_id) : null;
                  const isDragOver = dragOverCell === cellId;

                  return (
                    <div
                      key={cellId}
                      onDragOver={(e) => handleDragOver(e, cellId)}
                      onDrop={(e) => handleDrop(e, dateStr)}
                      onDragLeave={() => setDragOverCell(null)}
                      className={`
                        relative min-h-[200px] p-4 transition-all border-l border-slate-50
                        ${isDragOver ? 'bg-slate-100 scale-[0.98] z-10 rounded-2xl' : 'bg-white hover:bg-slate-50/50'}
                      `}
                    >
                      {plannedRecipe ? (
                        <div
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, 'RECIPE', plannedRecipe.recipe_id, { date: dateStr })
                          }
                          className="h-full bg-white rounded-2xl border-2 border-slate-100 p-4 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group cursor-grab active:cursor-grabbing flex flex-col"
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="font-extrabold text-sm text-slate-900 leading-tight line-clamp-3" title={plannedRecipe.title}>
                              {plannedRecipe.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEntry(dateStr);
                              }}
                              className="text-slate-300 hover:text-slate-900 p-1 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Servings */}
                          <div className="mb-3">
                            {servingsEdit?.date === dateStr ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={servingsEdit.servings}
                                  onChange={(e) =>
                                    setServingsEdit({
                                      ...servingsEdit,
                                      servings: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  onBlur={handleServingsUpdate}
                                  onKeyDown={(e) => e.key === 'Enter' && handleServingsUpdate()}
                                  className="w-16 px-2 py-1 border rounded text-xs"
                                  autoFocus
                                />
                                <span className="text-[10px] text-slate-400">servings</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setServingsEdit({ date: dateStr, servings: entry!.servings });
                                }}
                                className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-lg hover:bg-slate-100"
                              >
                                {entry!.servings} servings
                              </button>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-500 font-medium line-clamp-3 mb-4 flex-1 leading-relaxed">
                            {plannedRecipe.notes || 'No description.'}
                          </p>

                          <div className="flex gap-1.5 flex-wrap">
                            {plannedRecipe.tag_ids.map((tid) => (
                              <div
                                key={tid}
                                className="w-2 h-2 rounded-full bg-slate-200"
                                title={getTag(tid)?.name}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => isMobile && handleMobileCellClick(dateStr)}
                          className={`h-full border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center transition-all ${
                            isMobile
                              ? 'opacity-70 hover:opacity-100 hover:border-slate-300 cursor-pointer active:scale-95'
                              : 'opacity-40'
                          }`}
                        >
                          {isMobile ? (
                            <Plus size={32} className="text-slate-300" />
                          ) : (
                            <Utensils size={24} className="text-slate-100" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Tag Selection */}
      <Modal
        isOpen={tagSelection.isOpen}
        onClose={() => setTagSelection({ ...tagSelection, isOpen: false })}
        title={`Select ${getTag(tagSelection.tagId || '')?.name} Recipe`}
      >
        <div className="space-y-4">
          {tagRecipes.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {tagRecipes.map((r) => (
                <button
                  key={r.recipe_id}
                  onClick={() => handleSelectRecipeFromTag(r.recipe_id)}
                  className="flex items-center gap-4 w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-slate-900 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="bg-slate-100 text-slate-900 p-3 rounded-xl">
                    <Check size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-slate-900 text-base">{r.title}</div>
                    <div className="text-xs text-slate-500 font-medium">{r.notes || 'No notes.'}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
              <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-900 font-black">No matching recipes found.</p>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">
                Please add a recipe with this tag first.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Mobile Recipe Selection Modal */}
      <Modal
        isOpen={mobileAddRecipe.isOpen}
        onClose={() => setMobileAddRecipe({ isOpen: false, date: null, selectedTags: [] })}
        title="Add Recipe"
        size="lg"
      >
        <div className="space-y-6">
          {/* Tag Selection */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
              Filter by Tags (Optional)
            </h3>
            <div className="space-y-4">
              {TAG_TYPES.map((type) => {
                const typeTags = tags.filter((t) => t.type === type);
                if (typeTags.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">
                      {type}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {typeTags.map((tag) => {
                        const isSelected = mobileAddRecipe.selectedTags.includes(tag.tag_id);
                        return (
                          <button
                            key={tag.tag_id}
                            type="button"
                            onClick={() => handleMobileToggleTag(tag.tag_id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recipe Selection */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
              Select Recipe
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {mobileFilteredRecipes.length > 0 ? (
                mobileFilteredRecipes.map((recipe) => (
                  <button
                    key={recipe.recipe_id}
                    onClick={() => handleMobileSelectRecipe(recipe.recipe_id)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-900 hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="font-bold text-slate-900 text-sm mb-2">{recipe.title}</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {recipe.tag_ids.slice(0, 3).map((tid) => {
                        const t = getTag(tid);
                        return t ? (
                          <span
                            key={tid}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full uppercase"
                          >
                            {t.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                    {recipe.notes && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{recipe.notes}</p>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                  <AlertCircle className="mx-auto text-slate-200 mb-3" size={40} />
                  <p className="text-slate-900 font-bold text-sm">No recipes found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {mobileAddRecipe.selectedTags.length > 0
                      ? 'Try selecting different tags'
                      : 'Add recipes in the Recipes tab first'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
