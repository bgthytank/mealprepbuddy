import React, { useState } from 'react';
import { Plus, AlertTriangle, Bell, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Rule, Tag, Recipe, ConstraintRuleCreate, ActionRuleCreate, TargetType } from '../types';

interface RulesManagerProps {
  rules: Rule[];
  tags: Tag[];
  recipes: Recipe[];
  onAddConstraintRule: (rule: ConstraintRuleCreate) => void;
  onAddActionRule: (rule: ActionRuleCreate) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, enabled: boolean) => void;
}

export const RulesManager: React.FC<RulesManagerProps> = ({
  rules,
  tags,
  recipes,
  onAddConstraintRule,
  onAddActionRule,
  onDeleteRule,
  onToggleRule,
}) => {
  const [activeTab, setActiveTab] = useState<'constraints' | 'actions'>('constraints');

  // Constraint form
  const [constraintForm, setConstraintForm] = useState<ConstraintRuleCreate>({
    tag_id: '',
    max_count: 3,
  });

  // Action form
  const [actionForm, setActionForm] = useState<{
    target_type: TargetType;
    tag_id: string;
    recipe_id: string;
    offset_days: number;
    time_local: string;
    message_template: string;
  }>({
    target_type: 'TAG',
    tag_id: '',
    recipe_id: '',
    offset_days: -1,
    time_local: '10:00',
    message_template: 'Thaw for {day_of_week} ({meal_date}): {recipe_title}',
  });

  const constraintRules = rules.filter((r) => r.rule_kind === 'CONSTRAINT');
  const actionRules = rules.filter((r) => r.rule_kind === 'ACTION');

  const getTag = (id: string) => tags.find((t) => t.tag_id === id);
  const getRecipe = (id: string) => recipes.find((r) => r.recipe_id === id);

  const handleConstraintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (constraintForm.tag_id) {
      onAddConstraintRule(constraintForm);
      setConstraintForm({ tag_id: '', max_count: 3 });
    }
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ActionRuleCreate = {
      target_type: actionForm.target_type,
      offset_days: actionForm.offset_days,
      time_local: actionForm.time_local,
      message_template: actionForm.message_template,
    };

    if (actionForm.target_type === 'TAG' && actionForm.tag_id) {
      data.tag_id = actionForm.tag_id;
    } else if (actionForm.target_type === 'RECIPE' && actionForm.recipe_id) {
      data.recipe_id = actionForm.recipe_id;
    } else {
      return;
    }

    onAddActionRule(data);
    setActionForm({
      target_type: 'TAG',
      tag_id: '',
      recipe_id: '',
      offset_days: -1,
      time_local: '10:00',
      message_template: 'Thaw for {day_of_week} ({meal_date}): {recipe_title}',
    });
  };

  return (
    <div className="p-8 max-w-screen-2xl mx-auto h-full flex flex-col gap-10 font-sans text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase">Rules</h1>
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('constraints')}
            className={`text-sm font-black pb-2 transition-all border-b-4 ${
              activeTab === 'constraints'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            CONSTRAINTS
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`text-sm font-black pb-2 transition-all border-b-4 ${
              activeTab === 'actions'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            REMINDERS
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 flex-1 min-h-0">
        {/* Form Panel */}
        <div className="w-full lg:w-96 shrink-0 h-fit">
          {activeTab === 'constraints' ? (
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-50 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="text-amber-500" size={24} />
                <h2 className="text-2xl font-black tracking-tight uppercase">New Constraint</h2>
              </div>

              <p className="text-sm text-slate-500">
                Limit how many times a tag can appear per week.
              </p>

              <form onSubmit={handleConstraintSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tag to Limit
                  </label>
                  <select
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-sm"
                    value={constraintForm.tag_id}
                    onChange={(e) => setConstraintForm({ ...constraintForm, tag_id: e.target.value })}
                  >
                    <option value="">Select a tag...</option>
                    {tags.map((t) => (
                      <option key={t.tag_id} value={t.tag_id}>
                        {t.name} ({t.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Maximum Times Per Week
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold"
                    value={constraintForm.max_count}
                    onChange={(e) =>
                      setConstraintForm({ ...constraintForm, max_count: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={!constraintForm.tag_id}
                  className="w-full py-5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all"
                >
                  <Plus size={20} /> ADD CONSTRAINT
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-50 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="text-blue-500" size={24} />
                <h2 className="text-2xl font-black tracking-tight uppercase">New Reminder</h2>
              </div>

              <p className="text-sm text-slate-500">
                Create reminders that appear in your calendar export.
              </p>

              <form onSubmit={handleActionSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Target Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActionForm({ ...actionForm, target_type: 'TAG' })}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                        actionForm.target_type === 'TAG'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-400 border-slate-100'
                      }`}
                    >
                      By Tag
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionForm({ ...actionForm, target_type: 'RECIPE' })}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                        actionForm.target_type === 'RECIPE'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-400 border-slate-100'
                      }`}
                    >
                      By Recipe
                    </button>
                  </div>
                </div>

                {actionForm.target_type === 'TAG' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Select Tag
                    </label>
                    <select
                      required
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-sm"
                      value={actionForm.tag_id}
                      onChange={(e) => setActionForm({ ...actionForm, tag_id: e.target.value })}
                    >
                      <option value="">Select a tag...</option>
                      {tags.map((t) => (
                        <option key={t.tag_id} value={t.tag_id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Select Recipe
                    </label>
                    <select
                      required
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-sm"
                      value={actionForm.recipe_id}
                      onChange={(e) => setActionForm({ ...actionForm, recipe_id: e.target.value })}
                    >
                      <option value="">Select a recipe...</option>
                      {recipes.map((r) => (
                        <option key={r.recipe_id} value={r.recipe_id}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Days Before
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold"
                      value={Math.abs(actionForm.offset_days)}
                      onChange={(e) =>
                        setActionForm({
                          ...actionForm,
                          offset_days: -Math.abs(parseInt(e.target.value) || 1),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold"
                      value={actionForm.time_local}
                      onChange={(e) => setActionForm({ ...actionForm, time_local: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Message Template
                  </label>
                  <textarea
                    required
                    placeholder="Thaw for {day_of_week}: {recipe_title}"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-sm min-h-[80px] resize-none"
                    value={actionForm.message_template}
                    onChange={(e) => setActionForm({ ...actionForm, message_template: e.target.value })}
                  />
                  <p className="text-[9px] text-slate-400">
                    Use: {'{meal_date}'}, {'{recipe_title}'}, {'{day_of_week}'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    (actionForm.target_type === 'TAG' && !actionForm.tag_id) ||
                    (actionForm.target_type === 'RECIPE' && !actionForm.recipe_id)
                  }
                  className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all"
                >
                  <Plus size={20} /> ADD REMINDER
                </button>
              </form>
            </div>
          )}
        </div>

        {/* List Panel */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {activeTab === 'constraints' ? (
            <div className="space-y-4">
              {constraintRules.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <AlertTriangle className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-bold">No constraint rules yet</p>
                </div>
              ) : (
                constraintRules.map((rule) => {
                  if (rule.rule_kind !== 'CONSTRAINT') return null;
                  const tag = getTag(rule.tag_id);
                  return (
                    <div
                      key={rule.rule_id}
                      className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-6"
                    >
                      <button
                        onClick={() => onToggleRule(rule.rule_id, !rule.enabled)}
                        className={`transition-colors ${rule.enabled ? 'text-green-500' : 'text-slate-300'}`}
                      >
                        {rule.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">
                          Max <span className="text-amber-500">{rule.max_count}</span>{' '}
                          <span className="bg-slate-100 px-2 py-1 rounded-lg text-sm">
                            {tag?.name || rule.tag_id}
                          </span>{' '}
                          meals per week
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteRule(rule.rule_id)}
                        className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {actionRules.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <Bell className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-bold">No reminder rules yet</p>
                </div>
              ) : (
                actionRules.map((rule) => {
                  if (rule.rule_kind !== 'ACTION') return null;
                  const targetName =
                    rule.target_type === 'TAG'
                      ? getTag(rule.tag_id || '')?.name
                      : getRecipe(rule.recipe_id || '')?.title;
                  return (
                    <div
                      key={rule.rule_id}
                      className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-6"
                    >
                      <button
                        onClick={() => onToggleRule(rule.rule_id, !rule.enabled)}
                        className={`transition-colors ${rule.enabled ? 'text-green-500' : 'text-slate-300'}`}
                      >
                        {rule.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">
                          Remind{' '}
                          <span className="text-blue-500">
                            {Math.abs(rule.offset_days)} day{Math.abs(rule.offset_days) !== 1 && 's'}
                          </span>{' '}
                          before at <span className="text-blue-500">{rule.time_local}</span>
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          For {rule.target_type.toLowerCase()}:{' '}
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold">
                            {targetName || 'Unknown'}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-2 italic">"{rule.message_template}"</p>
                      </div>
                      <button
                        onClick={() => onDeleteRule(rule.rule_id)}
                        className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
