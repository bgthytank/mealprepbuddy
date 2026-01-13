// Tag Types (fixed enum from design)
export type TagType = 'PROTEIN' | 'PORTION' | 'PREP' | 'OTHER';

export interface Tag {
  tag_id: string;
  name: string;
  type: TagType;
  household_id: string;
  created_at: string;
}

export interface TagCreate {
  name: string;
  type: TagType;
}

// Recipe
export interface Recipe {
  recipe_id: string;
  title: string;
  tag_ids: string[];
  default_servings: number;
  notes: string | null;
  household_id: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeCreate {
  title: string;
  tag_ids: string[];
  default_servings: number;
  notes?: string;
}

// Rules
export type RuleKind = 'CONSTRAINT' | 'ACTION';
export type ConstraintType = 'MAX_MEALS_PER_WEEK_BY_TAG';
export type ActionType = 'REMIND_OFFSET_DAYS_BEFORE_DINNER';
export type TargetType = 'TAG' | 'RECIPE';

export interface ConstraintRule {
  rule_id: string;
  rule_kind: 'CONSTRAINT';
  constraint_type: ConstraintType;
  tag_id: string;
  max_count: number;
  enabled: boolean;
  household_id: string;
  created_at: string;
  updated_at: string;
}

export interface ActionRule {
  rule_id: string;
  rule_kind: 'ACTION';
  action_type: ActionType;
  target_type: TargetType;
  tag_id: string | null;
  recipe_id: string | null;
  offset_days: number;
  time_local: string;
  message_template: string;
  enabled: boolean;
  household_id: string;
  created_at: string;
  updated_at: string;
}

export type Rule = ConstraintRule | ActionRule;

export interface ConstraintRuleCreate {
  tag_id: string;
  max_count: number;
  enabled?: boolean;
}

export interface ActionRuleCreate {
  target_type: TargetType;
  tag_id?: string;
  recipe_id?: string;
  offset_days: number;
  time_local: string;
  message_template: string;
  enabled?: boolean;
}

// Weekly Plan
export interface PlanEntry {
  recipe_id: string;
  servings: number;
}

export interface WeeklyPlan {
  week_start_date: string;
  entries: Record<string, PlanEntry | null>;
  household_id: string;
  updated_at: string;
}

export interface PlanEntryUpdate {
  date: string;
  recipe_id: string;
  servings: number;
}

// Validation
export interface ValidationWarning {
  rule_id: string;
  type: string;
  message: string;
  details: Record<string, unknown>;
}

export interface ValidationResult {
  warnings: ValidationWarning[];
}

// Auth
export interface User {
  user_id: string;
  email: string;
  household_id: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// UI State
export interface DragItem {
  type: 'RECIPE' | 'TAG';
  id: string;
  source?: { date: string };
}
