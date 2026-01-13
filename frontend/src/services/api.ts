import type {
  Tag, TagCreate, Recipe, RecipeCreate, RecipeUpdate, Rule,
  ConstraintRuleCreate, ActionRuleCreate, WeeklyPlan,
  PlanEntryUpdate, ValidationResult, AuthResponse
} from '../types';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.fetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return this.fetch<Tag[]>('/tags');
  }

  async createTag(data: TagCreate): Promise<Tag> {
    return this.fetch<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(tagId: string): Promise<void> {
    return this.fetch<void>(`/tags/${tagId}`, { method: 'DELETE' });
  }

  // Recipes
  async getRecipes(tagId?: string, q?: string): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (tagId) params.set('tag_id', tagId);
    if (q) params.set('q', q);
    const query = params.toString();
    return this.fetch<Recipe[]>(`/recipes${query ? `?${query}` : ''}`);
  }

  async createRecipe(data: RecipeCreate): Promise<Recipe> {
    return this.fetch<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(recipeId: string, data: RecipeUpdate): Promise<Recipe> {
    return this.fetch<Recipe>(`/recipes/${recipeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    return this.fetch<void>(`/recipes/${recipeId}`, { method: 'DELETE' });
  }

  // Rules
  async getRules(): Promise<Rule[]> {
    return this.fetch<Rule[]>('/rules');
  }

  async createConstraintRule(data: ConstraintRuleCreate): Promise<Rule> {
    return this.fetch<Rule>('/rules/constraint/max_meals_per_week_by_tag', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createActionRule(data: ActionRuleCreate): Promise<Rule> {
    return this.fetch<Rule>('/rules/action/remind_offset_days_before_dinner', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRule(ruleId: string): Promise<void> {
    return this.fetch<void>(`/rules/${ruleId}`, { method: 'DELETE' });
  }

  async toggleRule(ruleId: string, enabled: boolean): Promise<Rule> {
    return this.fetch<Rule>(`/rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  // Plans
  async getWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan> {
    return this.fetch<WeeklyPlan>(`/plans/${weekStartDate}`);
  }

  async updatePlanEntry(weekStartDate: string, data: PlanEntryUpdate): Promise<WeeklyPlan> {
    return this.fetch<WeeklyPlan>(`/plans/${weekStartDate}/entry`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlanEntry(weekStartDate: string, date: string): Promise<WeeklyPlan> {
    return this.fetch<WeeklyPlan>(`/plans/${weekStartDate}/entry?date=${date}`, {
      method: 'DELETE',
    });
  }

  async validatePlan(weekStartDate: string): Promise<ValidationResult> {
    return this.fetch<ValidationResult>(`/plans/${weekStartDate}/validate`, {
      method: 'POST',
    });
  }

  async exportIcs(weekStartDate: string): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/plans/${weekStartDate}/export.ics`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mealprep_${weekStartDate}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const api = new ApiService();
