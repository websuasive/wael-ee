// Core types for the questionnaire feature. UI-only; no assembler imports.

export interface QuestionOption {
  value: string;
  label: string;
  help?: string;
}

export interface ConditionalCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'present' | 'absent';
  value?: string;
}

export interface QuestionDef {
  id: string;
  renderer: string;
  prompt: string;
  help?: string;
  options?: QuestionOption[];
  config?: Record<string, unknown>;
  required: boolean;
  conditionalOn?: string | ConditionalCondition;
}

export interface PageDef {
  id: string;
  kind?: 'card' | 'past_presence_pair' | 'content';
  questions: QuestionDef[];
}

export interface Manifest {
  pages: PageDef[];
}

// Permissive type for now; exact answer shapes come later with the real manifest.
export type AnswerValue = string | number | string[] | object | null;

// Card sub-question structure for Part C direction cards
export interface CardSubQuestion {
  id: string;
  prompt: string;
  options: QuestionOption[];
  required: boolean;
  conditionalOn?: string | ConditionalCondition;
}

// Per-slider domain configuration for domain_sliders renderer
export interface DomainSliderConfig {
  key: string;
  label: string;
  minLabel?: string;
  maxLabel?: string;
}

// Config for specific question types
export interface QuestionConfig {
  multiSelect?: boolean;
  min?: number;
  max?: number;
  exclusiveKey?: string;
  sliderMin?: number;
  sliderMax?: number;
  minLabel?: string;
  maxLabel?: string;
  subQuestions?: CardSubQuestion[];
  directionKey?: string;
  // For domain_sliders renderer: array of domain configs (preferred) or legacy string array
  domains?: DomainSliderConfig[] | string[];
}

export interface PersistedSession {
  userId: string;
  answers: Record<string, AnswerValue>;
  lastPageId: string | null;
  status: 'in_progress' | 'complete';
}

export interface SessionPersistence {
  load(userId: string): Promise<PersistedSession | null>;
  save(session: PersistedSession): Promise<void>;
}
