// Type re-exports (engine input/output types from spec sections 3.1 and 6.6)
export type * from './types';

// Validation surface
export { validateInputMap } from './validation';
export type {
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from './validation';

// Engine entry point
export { runEngine } from './engine';
export type { EngineResult } from './engine';
