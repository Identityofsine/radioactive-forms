/**
 * Namespace containing common validator functions for form controls.
 * Validators return true when the value is valid, false when invalid.
 */
export namespace Validators {
  /**
   * Validator that requires a value to be present and non-empty.
   * 
   * @template T - The type of the value being validated
   * @param value - The value to validate
   * @returns True if the value is present and non-empty, false otherwise
   * 
   * @remarks
   * Validation rules:
   * - null or undefined: invalid
   * - Empty string (after trim): invalid
   * - Empty array: invalid
   * - Empty object (no keys): invalid
   * - All other values: valid
   * 
   * @example
   * ```typescript
   * Validators.required('hello') // true
   * Validators.required('') // false
   * Validators.required(null) // false
   * Validators.required([]) // false
   * Validators.required({}) // false
   * Validators.required({ name: 'John' }) // true
   * ```
   */
  export const required = <T>(value: T): boolean => {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).length > 0;
    }
    return true;
  }
}
