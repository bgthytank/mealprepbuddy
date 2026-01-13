import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Login } from './views/Login';
import { WeeklyPlanner } from './views/WeeklyPlanner';
import { RecipeManager } from './views/RecipeManager';
import { RulesManager } from './views/RulesManager';
import { Modal } from './components/ui/Modal';
import {
  LayoutGrid,
  BookOpen,
  Scale,
  AlertTriangle,
  CheckCircle,
  UtensilsCrossed,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react';
import type { User, Recipe, Tag, Rule, WeeklyPlan, ValidationWarning } from './types';

// Get Monday of current week
const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [weekStartDate, setWeekStartDate] = useState(getMondayOfCurrentWeek());

  // UI State
  const [activeTab, setActiveTab] = useState<'planner' | 'recipes' | 'rules'>('planner');
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<
    { type: 'success' | 'error'; message: string }[]
  >([]);

  // Check for existing token on mount
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Load plan when week changes
  useEffect(() => {
    if (user) {
      loadPlan();
    }
  }, [weekStartDate, user]);

  const loadAllData = async () => {
    try {
      const [tagsData, recipesData, rulesData, planData] = await Promise.all([
        api.getTags(),
        api.getRecipes(),
        api.getRules(),
        api.getWeeklyPlan(weekStartDate),
      ]);
      setTags(tagsData);
      setRecipes(recipesData);
      setRules(rulesData);
      setPlan(planData);
      // If we got data, we're logged in
      setUser({ user_id: '', email: '', household_id: '', created_at: '' });
    } catch {
      api.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlan = async () => {
    try {
      const planData = await api.getWeeklyPlan(weekStartDate);
      setPlan(planData);
    } catch {
      // Ignore errors
    }
  };

  const addNotification = (type: 'success' | 'error', message: string) => {
    setNotifications((prev) => [...prev, { type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.message !== message));
    }, 4000);
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLoading(true);
    await loadAllData();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setRecipes([]);
    setTags([]);
    setRules([]);
    setPlan(null);
  };

  // Recipe handlers
  const handleAddRecipe = async (recipeData: Parameters<typeof api.createRecipe>[0]) => {
    try {
      const recipe = await api.createRecipe(recipeData);
      setRecipes((prev) => [...prev, recipe]);
      addNotification('success', `Recipe "${recipe.title}" added.`);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to add recipe');
    }
  };

  const handleEditRecipe = async (id: string, recipeData: Parameters<typeof api.updateRecipe>[1]) => {
    try {
      const updated = await api.updateRecipe(id, recipeData);
      setRecipes((prev) => prev.map((r) => (r.recipe_id === id ? updated : r)));
      addNotification('success', `Recipe "${updated.title}" updated.`);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to update recipe');
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await api.deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.recipe_id !== id));
      addNotification('success', 'Recipe deleted.');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to delete recipe');
    }
  };

  // Tag handlers
  const handleAddTag = async (tagData: Parameters<typeof api.createTag>[0]) => {
    try {
      const tag = await api.createTag(tagData);
      setTags((prev) => [...prev, tag]);
      addNotification('success', `Tag "${tag.name}" added.`);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to add tag');
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      await api.deleteTag(id);
      setTags((prev) => prev.filter((t) => t.tag_id !== id));
      addNotification('success', 'Tag deleted.');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  // Rule handlers
  const handleAddConstraintRule = async (ruleData: Parameters<typeof api.createConstraintRule>[0]) => {
    try {
      const rule = await api.createConstraintRule(ruleData);
      setRules((prev) => [...prev, rule]);
      addNotification('success', 'Constraint rule added.');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to add rule');
    }
  };

  const handleAddActionRule = async (ruleData: Parameters<typeof api.createActionRule>[0]) => {
    try {
      const rule = await api.createActionRule(ruleData);
      setRules((prev) => [...prev, rule]);
      addNotification('success', 'Reminder rule added.');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to add rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await api.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.rule_id !== id));
      addNotification('success', 'Rule deleted.');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      const updated = await api.toggleRule(id, enabled);
      setRules((prev) => prev.map((r) => (r.rule_id === id ? updated : r)));
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  // Plan handlers
  const handleUpdateEntry = async (date: string, recipeId: string, servings: number) => {
    try {
      const updated = await api.updatePlanEntry(weekStartDate, { date, recipe_id: recipeId, servings });
      setPlan(updated);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  const handleDeleteEntry = async (date: string) => {
    try {
      const updated = await api.deletePlanEntry(weekStartDate, date);
      setPlan(updated);
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleValidate = async () => {
    try {
      const result = await api.validatePlan(weekStartDate);
      if (result.warnings.length > 0) {
        result.warnings.forEach((w: ValidationWarning) => addNotification('error', w.message));
      } else {
        addNotification('success', 'Plan validated! No warnings.');
      }
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Validation failed');
    }
  };

  const handleExport = async () => {
    try {
      await api.exportIcs(weekStartDate);
      addNotification('success', 'Calendar exported!');
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
        <Loader2 size={48} className="animate-spin text-slate-900" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Loading...</p>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-lg">
              <UtensilsCrossed size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">MEALPREP</h1>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                Buddy
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button
                onClick={() => setActiveTab('planner')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'planner'
                    ? 'bg-white text-slate-900 shadow-xl'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid size={18} />
                Planning
              </button>
              <button
                onClick={() => setActiveTab('recipes')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'recipes'
                    ? 'bg-white text-slate-900 shadow-xl'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <BookOpen size={18} />
                Recipes
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'rules'
                    ? 'bg-white text-slate-900 shadow-xl'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Scale size={18} />
                Rules
              </button>
            </nav>

            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'planner' && (
          <WeeklyPlanner
            recipes={recipes}
            tags={tags}
            plan={plan}
            weekStartDate={weekStartDate}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onValidate={handleValidate}
            onExport={handleExport}
            onWeekChange={setWeekStartDate}
          />
        )}
        {activeTab === 'recipes' && (
          <RecipeManager
            recipes={recipes}
            tags={tags}
            onAddRecipe={handleAddRecipe}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
          />
        )}
        {activeTab === 'rules' && (
          <RulesManager
            rules={rules}
            tags={tags}
            recipes={recipes}
            onAddConstraintRule={handleAddConstraintRule}
            onAddActionRule={handleAddActionRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
          />
        )}
      </main>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="font-black text-slate-900 text-lg mb-4">Account</h3>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group"
            >
              <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
              <span className="font-bold text-slate-700 group-hover:text-red-600">Sign Out</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Notifications */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
        {notifications.map((n, idx) => (
          <div
            key={idx}
            className={`
              flex items-center gap-4 px-6 py-5 rounded-[24px] shadow-2xl border-2 pointer-events-auto animate-in slide-in-from-bottom-10 duration-500
              ${
                n.type === 'error'
                  ? 'bg-white border-amber-400 text-slate-900'
                  : 'bg-slate-900 border-slate-900 text-white'
              }
            `}
          >
            <div className={`p-1 rounded-lg ${n.type === 'error' ? 'text-amber-500' : 'text-emerald-400'}`}>
              {n.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            </div>
            <span className="text-sm font-black tracking-tight">{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
