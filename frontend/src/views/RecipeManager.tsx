import React, { useState } from 'react';
import { Plus, Search, Tag as TagIcon, ChefHat, Trash2, Layers, X } from 'lucide-react';
import type { Recipe, Tag, TagType, RecipeCreate, TagCreate } from '../types';

interface RecipeManagerProps {
  recipes: Recipe[];
  tags: Tag[];
  onAddRecipe: (recipe: RecipeCreate) => void;
  onDeleteRecipe: (id: string) => void;
  onAddTag: (tag: TagCreate) => void;
  onDeleteTag: (id: string) => void;
}

const TAG_TYPES: TagType[] = ['PROTEIN', 'PORTION', 'PREP', 'OTHER'];

export const RecipeManager: React.FC<RecipeManagerProps> = ({
  recipes,
  tags,
  onAddRecipe,
  onDeleteRecipe,
  onAddTag,
  onDeleteTag,
}) => {
  const [newRecipe, setNewRecipe] = useState<Partial<RecipeCreate>>({
    title: '',
    notes: '',
    tag_ids: [],
    default_servings: 4,
  });
  const [newTag, setNewTag] = useState<{ name: string; type: TagType }>({
    name: '',
    type: 'PROTEIN',
  });
  const [filterText, setFilterText] = useState('');
  const [activeSection, setActiveSection] = useState<'recipes' | 'tags'>('recipes');

  const handleToggleTag = (tagId: string) => {
    const currentTags = [...(newRecipe.tag_ids || [])];
    if (currentTags.includes(tagId)) {
      setNewRecipe({ ...newRecipe, tag_ids: currentTags.filter((id) => id !== tagId) });
    } else {
      setNewRecipe({ ...newRecipe, tag_ids: [...currentTags, tagId] });
    }
  };

  const handleRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecipe.title && newRecipe.tag_ids?.length) {
      onAddRecipe({
        title: newRecipe.title,
        notes: newRecipe.notes,
        tag_ids: newRecipe.tag_ids,
        default_servings: newRecipe.default_servings || 4,
      });
      setNewRecipe({ title: '', notes: '', tag_ids: [], default_servings: 4 });
    }
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.name.trim()) {
      onAddTag({ name: newTag.name.trim(), type: newTag.type });
      setNewTag({ ...newTag, name: '' });
    }
  };

  const filteredRecipes = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(filterText.toLowerCase()) ||
      (r.notes || '').toLowerCase().includes(filterText.toLowerCase())
  );

  const getTag = (id: string) => tags.find((t) => t.tag_id === id);

  return (
    <div className="p-8 max-w-screen-2xl mx-auto h-full flex flex-col gap-10 font-sans text-slate-900">
      {/* Header & Section Switching */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase">Collection</h1>
          <div className="flex gap-6">
            <button
              onClick={() => setActiveSection('recipes')}
              className={`text-sm font-black pb-2 transition-all border-b-4 ${
                activeSection === 'recipes'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              RECIPES
            </button>
            <button
              onClick={() => setActiveSection('tags')}
              className={`text-sm font-black pb-2 transition-all border-b-4 ${
                activeSection === 'tags'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              LABELS
            </button>
          </div>
        </div>

        {activeSection === 'recipes' && (
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search recipes..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none transition-all font-bold text-sm"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-12 flex-1 min-h-0">
        {/* PANEL LEFT: ADDING */}
        <div className="w-full lg:w-96 shrink-0 h-fit">
          {activeSection === 'recipes' ? (
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-50 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="text-slate-900" size={24} />
                <h2 className="text-2xl font-black tracking-tight uppercase">New Recipe</h2>
              </div>

              <form onSubmit={handleRecipeSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Recipe Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Italian Lasagna"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold"
                    value={newRecipe.title}
                    onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Default Servings
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold"
                    value={newRecipe.default_servings}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, default_servings: parseInt(e.target.value) || 4 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Brief summary of preparation..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-sm min-h-[100px] resize-none"
                    value={newRecipe.notes}
                    onChange={(e) => setNewRecipe({ ...newRecipe, notes: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Tags (Select at least 1)
                  </label>
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                    {TAG_TYPES.map((type) => {
                      const typeTags = tags.filter((t) => t.type === type);
                      if (typeTags.length === 0) return null;
                      return (
                        <div key={type}>
                          <span className="text-[10px] font-bold text-slate-300 uppercase block mb-2">
                            {type}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {typeTags.map((tag) => {
                              const isActive = newRecipe.tag_ids?.includes(tag.tag_id);
                              return (
                                <button
                                  key={tag.tag_id}
                                  type="button"
                                  onClick={() => handleToggleTag(tag.tag_id)}
                                  className={`
                                    px-4 py-2 rounded-xl text-xs font-black transition-all border-2
                                    ${
                                      isActive
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                    }
                                  `}
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

                <button
                  type="submit"
                  disabled={!newRecipe.title || !newRecipe.tag_ids?.length}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  <Plus size={20} /> ADD RECIPE
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-50 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <TagIcon className="text-slate-900" size={24} />
                <h2 className="text-2xl font-black tracking-tight uppercase">New Label</h2>
              </div>
              <form onSubmit={handleTagSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Label Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicken"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Type Category
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-sm"
                    value={newTag.type}
                    onChange={(e) => setNewTag({ ...newTag, type: e.target.value as TagType })}
                  >
                    {TAG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!newTag.name.trim()}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all"
                >
                  <Plus size={20} /> ADD LABEL
                </button>
              </form>
            </div>
          )}
        </div>

        {/* PANEL RIGHT: LISTING */}
        <div className="flex-1 min-h-0">
          {activeSection === 'recipes' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10 pr-2 custom-scrollbar h-full">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.recipe_id}
                  className="bg-white p-6 rounded-[32px] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:border-slate-100 transition-all group relative overflow-hidden flex flex-col"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-black text-slate-900 group-hover:underline underline-offset-4 decoration-4 decoration-slate-900/10 transition-all">
                        {recipe.title}
                      </h3>
                      <button
                        onClick={() => onDeleteRecipe(recipe.recipe_id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                        title="Delete recipe"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      <span className="font-bold">{recipe.default_servings}</span> servings
                    </p>
                    <p className="text-slate-400 text-sm font-medium mb-6 line-clamp-3 leading-relaxed">
                      {recipe.notes || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                    {recipe.tag_ids.map((tid) => {
                      const t = getTag(tid);
                      return t ? (
                        <span
                          key={tid}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded-full border border-slate-100"
                        >
                          {t.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
              {filteredRecipes.length === 0 && (
                <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-100 border-4 border-dashed border-slate-50 rounded-[40px]">
                  <ChefHat size={64} className="mb-4 opacity-20" />
                  <p className="text-lg font-black uppercase tracking-widest">No recipes found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12 overflow-y-auto h-full pr-2 pb-10 custom-scrollbar">
              {TAG_TYPES.map((type) => {
                const typeTags = tags.filter((t) => t.type === type);
                return (
                  <div key={type} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Layers size={20} className="text-slate-900" />
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                        {type} Labels
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {typeTags.map((tag) => (
                        <div
                          key={tag.tag_id}
                          className="p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-slate-900 transition-all flex items-center justify-between group"
                        >
                          <span className="font-bold text-sm text-slate-700">{tag.name}</span>
                          <button
                            onClick={() => onDeleteTag(tag.tag_id)}
                            className="text-slate-200 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {typeTags.length === 0 && (
                        <p className="text-sm text-slate-300 italic">No tags in this category</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
