/**
 * @module @form/functional
 * 
 * Functional programming helpers for creating forms and form controls.
 * Provides a more functional alternative to using `new Form()` and `new FormControl()`.
 * 
 * @example
 * ```typescript
 * import { formGroup, formControl } from '@form/functional';
 * 
 * const userForm = formGroup<User>({
 *   name: ['', Validators.required],
 *   email: ['']
 * });
 * ```
 */

export { formGroup } from "./form";
export { formControl } from "./formControl";
